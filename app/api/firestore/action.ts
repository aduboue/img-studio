'use server'

import { Timestamp } from '@google-cloud/firestore'
import { ExportImageFormFields, ExportImageFormI, ImageMetadataI } from '../export-utils'

const { Firestore, FieldValue } = require('@google-cloud/firestore')
const firestore = new Firestore()
firestore.settings({ ignoreUndefinedProperties: true })

export async function addNewFirestoreEntry(entryID: string, data: ExportImageFormI) {
  const document = firestore.collection('metadata').doc(entryID)

  let cleanData: ImageMetadataI = {} as ImageMetadataI
  data = { ...data.imageToExport, ...data }
  let combinedFilters: string[] = []

  Object.entries(ExportImageFormFields).forEach(([name, field]) => {
    const sourceProp = field.prop || name
    const valueFromData = data[sourceProp as keyof ExportImageFormI]
    let transformedValue = valueFromData

    if (Array.isArray(valueFromData) && valueFromData.every((item) => typeof item === 'string')) {
      transformedValue = valueFromData.length > 0 ? Object.fromEntries(valueFromData.map((str) => [str, true])) : null
      valueFromData.forEach((item) => combinedFilters.push(`${name}_${item}`))
    }

    cleanData[name as keyof ImageMetadataI] = transformedValue ?? null
  })

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
  let thisBatchDocuments: ImageMetadataI[] = []

  let query = collection

  if (filters) {
    const filterEntries = Object.entries(filters).filter(([, values]) => Array.isArray(values) && values.length > 0)
    let combinedFilterEntries: string[] = []
    for (const [filterKey, filterValues] of filterEntries) {
      ;(filterValues as string[]).forEach((filterValue) => {
        combinedFilterEntries.push(filterKey + '_' + filterValue)
      })
    }
    query = query.where('combinedFilters', 'array-contains-any', combinedFilterEntries)
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
      return data as ImageMetadataI
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
      let combinedFilterEntries: string[] = []
      for (const [filterKey, filterValues] of filterEntries) {
        ;(filterValues as string[]).forEach((filterValue) => {
          combinedFilterEntries.push(filterKey + '_' + filterValue)
        })
      }
      nextPageQuery = nextPageQuery.where('combinedFilters', 'array-contains-any', combinedFilterEntries)
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
