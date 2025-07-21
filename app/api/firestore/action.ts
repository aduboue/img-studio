// Copyright 2025 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use server'

import { Timestamp } from '@google-cloud/firestore'
import { ExportMediaFormI, MediaMetadataI, ExportMediaFormFieldsI } from '../export-utils'
import { deleteMedia } from '../cloud-storage/action'

const { Firestore, FieldValue } = require('@google-cloud/firestore')
const firestore = new Firestore()
firestore.settings({ ignoreUndefinedProperties: true })

export async function addNewFirestoreEntry(
  entryID: string,
  data: ExportMediaFormI,
  ExportImageFormFields: ExportMediaFormFieldsI
) {
  const document = firestore.collection('metadata').doc(entryID)

  let cleanData: MediaMetadataI = {} as MediaMetadataI
  data = { ...data.mediaToExport, ...data }
  let combinedFilters: string[] = []

  if (ExportImageFormFields) {
    Object.entries(ExportImageFormFields).forEach(([name, field]) => {
      const sourceProp = field.prop || name
      const valueFromData = data[sourceProp as keyof ExportMediaFormI]
      let transformedValue = valueFromData

      if (Array.isArray(valueFromData) && valueFromData.every((item) => typeof item === 'string')) {
        transformedValue = valueFromData.length > 0 ? Object.fromEntries(valueFromData.map((str) => [str, true])) : null
        valueFromData.forEach((item) => combinedFilters.push(`${name}_${item}`))
      }

      cleanData[name as keyof MediaMetadataI] = transformedValue ?? null
    })
  }

  const dataToSet = {
    ...cleanData,
    timestamp: FieldValue.serverTimestamp(),
    combinedFilters: combinedFilters,
  }

  try {
    const res = await document.set(dataToSet, { ignoreUndefinedProperties: true })
    return res._writeTime._seconds
  } catch (error) {
    console.error(error)
    return {
      error: 'Error while setting new metadata entry to database.',
    }
  }
}

export async function fetchDocumentsInBatches(lastVisibleDocument?: any, filters?: any) {
  const batchSize = 24

  const collection = firestore.collection('metadata')
  let thisBatchDocuments: MediaMetadataI[] = []

  let query = collection

  if (filters) {
    const filterEntries = Object.entries(filters).filter(([, values]) => Array.isArray(values) && values.length > 0)
    if (filterEntries.length > 0) {
      const combinedFilterEntries = filterEntries.flatMap(([filterKey, filterValues]) =>
        (filterValues as string[]).map((filterValue) => `${filterKey}_${filterValue}`)
      )
      if (combinedFilterEntries.length > 0)
        query = query.where('combinedFilters', 'array-contains-any', combinedFilterEntries)
    }
  }

  query = query.orderBy('timestamp', 'desc').limit(batchSize)

  try {
    if (lastVisibleDocument) {
      query = query.startAfter(
        new Timestamp(
          Math.floor(lastVisibleDocument.timestamp / 1000),
          (lastVisibleDocument.timestamp % 1000) * 1000000
        )
      )
    }

    const snapshot = await query.get()

    // No more documents
    if (snapshot.empty) {
      return { thisBatchDocuments: null, lastVisibleDocument: null, isMorePageToLoad: false }
    }

    thisBatchDocuments = snapshot.docs.map((doc: { data: () => any }) => {
      const data = doc.data()
      delete data.timestamp
      delete data.combinedFilters
      return data as MediaMetadataI
    })

    const newLastVisibleDocument = {
      id: snapshot.docs[snapshot.docs.length - 1].id,
      timestamp:
        snapshot.docs[snapshot.docs.length - 1].data().timestamp._seconds * 1000 +
        snapshot.docs[snapshot.docs.length - 1].data().timestamp._nanoseconds / 1000000,
    }

    // Check if there's a next page
    let nextPageQuery = collection
    if (filters) {
      const filterEntries = Object.entries(filters).filter(([, values]) => Array.isArray(values) && values.length > 0)
      if (filterEntries.length > 0) {
        const combinedFilterEntries = filterEntries.flatMap(([filterKey, filterValues]) =>
          (filterValues as string[]).map((filterValue) => `${filterKey}_${filterValue}`)
        )
        if (combinedFilterEntries.length > 0)
          nextPageQuery = nextPageQuery.where('combinedFilters', 'array-contains-any', combinedFilterEntries)
      }
    }

    nextPageQuery = nextPageQuery
      .orderBy('timestamp', 'desc')
      .limit(1)
      .startAfter(
        new Timestamp(
          Math.floor(newLastVisibleDocument.timestamp / 1000),
          (newLastVisibleDocument.timestamp % 1000) * 1000000
        )
      )
    const nextPageSnapshot = await nextPageQuery.get()
    const isMorePageToLoad = !nextPageSnapshot.empty

    return {
      thisBatchDocuments: thisBatchDocuments,
      lastVisibleDocument: newLastVisibleDocument,
      isMorePageToLoad: isMorePageToLoad,
    }
  } catch (error) {
    console.error(error)
    return {
      error: 'Error while fetching metadata',
    }
  }
}

export async function firestoreDeleteBatch(
  idsToDelete: string[],
  currentMedias: MediaMetadataI[]
): Promise<boolean | { error: string }> {
  // Ensure firestore is initialized and collection name is correct
  const collection = firestore.collection('metadata')
  const batch = firestore.batch()

  const gcsDeletionPromises: Promise<void>[] = []

  if (!idsToDelete || idsToDelete.length === 0) {
    console.log('No IDs provided for deletion. Exiting.')
    return true
  }

  for (const id of idsToDelete) {
    const mediaItem = currentMedias.find((media) => media.id === id)

    if (mediaItem && mediaItem.gcsURI)
      gcsDeletionPromises.push(
        deleteMedia(mediaItem.gcsURI)
          .then(() => {
            console.log(`Successfully deleted GCS file: ${mediaItem.gcsURI} for document ID: ${id}`)
          })
          .catch((error: any) => {
            console.error(`Failed to delete GCS file ${mediaItem.gcsURI} for document ID: ${id}. Error:`, error)
          })
      )

    // Add the Firestore document deletion to the batch
    const docRef = collection.doc(id)
    batch.delete(docRef)
  }

  // Attempt to delete all GCS files concurrently and wait for all attempts to settle.
  if (gcsDeletionPromises.length > 0) await Promise.all(gcsDeletionPromises)

  // Commit the batch of Firestore deletions
  try {
    await batch.commit()
    return true
  } catch (error) {
    console.error('Firestore batch commit failed:', error)

    return { error: `Firestore batch deletion failed. ` }
  }
}
