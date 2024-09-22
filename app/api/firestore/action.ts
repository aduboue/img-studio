'use server'

import { ExportImageFormFields, ExportImageFormI, ImageMetadataI } from "../export-utils";

const {Firestore} = require('@google-cloud/firestore');
const firestore = new Firestore();

export async function addNewFirestoreEntry(entryID: string, data: ExportImageFormI) {
  const document = firestore.collection('metadata').doc(entryID);

  let cleanData: ImageMetadataI = {} as ImageMetadataI
  data = { ...data.imageToExport , ...data}

  Object.entries(ExportImageFormFields).forEach(([name, field]) => {
    field.prop?  (cleanData[name as keyof ImageMetadataI] as any) = data[field.prop as keyof ExportImageFormI] ? data[field.prop as keyof ExportImageFormI] : null
    : (cleanData[name as keyof ImageMetadataI] as any) = data[name as keyof ExportImageFormI] ? data[name as keyof ExportImageFormI] : null
  })

  try {
    const res = await document.set(cleanData)
    return res._writeTime._seconds
  } catch (error) {
    console.error(error)
    return {
      error: 'Error while setting new metadata entry to database.',
    }
  }
}

export async function fetchAllDocumentsInBatches(batchSize: number) {
  const collection = firestore.collection('metadata');
  let allDocuments: ImageMetadataI[][] = [];
  let lastVisibleDocument = null;

  while (true) {
    let query = collection.limit(batchSize)

    if (lastVisibleDocument) {
      query = query.startAfter(lastVisibleDocument)
    }

    let snapshot
    try {
      snapshot = await query.get()
    } catch (error) {
      console.error(error)
      return {
        error: 'Error while fetching metadata',
      }
    }

    if (snapshot.empty) {
      break; // No more documents
    }

    const batchDocuments = snapshot.docs.map((doc: { data: () => any; }) => doc.data()) as ImageMetadataI[]
    allDocuments.push(batchDocuments)

    lastVisibleDocument = snapshot.docs[snapshot.docs.length - 1]
  }

  return allDocuments
}

/*export async function fetchedFilteredDocuments(batchSize: number, filters: any) {
  console.log("XXXX filters " + JSON.stringify(filters, undefined, 4)) //TODO remove
  const collection = firestore.collection('metadata');
  let allDocuments: ImageMetadataI[][] = [];
  let lastVisibleDocument = null;

  let baseQuery = collection;
  for (const [filterKey, filterValues] of Object.entries(filters)) {
    baseQuery = baseQuery.where(filterKey, 'array-contains-any', filterValues);
  }

  while (true) {
    let query = baseQuery.limit(batchSize);

    if (lastVisibleDocument) {
      query = query.startAfter(lastVisibleDocument);
    }

    let snapshot;
    try {
      snapshot = await query.get();
      console.log("XXXX " + JSON.stringify(snapshot.docs, undefined, 4)) //TODO remove
    } catch (error) {
      console.error(error);
      return {
        error: 'Error while fetching metadata',
      };
    }

    if (snapshot.empty) {
      break; // No more documents
    }

    const batchDocuments = snapshot.docs.map((doc: { data: () => any; }) => doc.data()) as ImageMetadataI[]
    allDocuments.push(batchDocuments);

    lastVisibleDocument = snapshot.docs[snapshot.docs.length - 1];
  }

  return allDocuments;
}*/

export async function fetchedFilteredDocuments(batchSize: number, filters: any) {
  const collection = firestore.collection('metadata');
  let allDocuments: ImageMetadataI[][] = [];

  // Extract filter keys and values
  const filterEntries = Object.entries(filters)
    .filter(([, values]) => Array.isArray(values) && values.length > 0);

  // If no filters, fetch all documents
  if (filterEntries.length === 0) {
    return fetchAllDocumentsInBatches(batchSize);
  }

  // Apply filters sequentially
  let currentDocuments: ImageMetadataI[] = [];
  for (const [filterKey, filterValues] of filterEntries) {
    let filteredBatchDocuments: ImageMetadataI[][] = [];
    let lastVisibleDocument = null;

    while (true) {
      let query = collection.where(filterKey, 'array-contains-any', filterValues).limit(batchSize);

      if (lastVisibleDocument) {
        query = query.startAfter(lastVisibleDocument);
      }

      const snapshot = await query.get();

      if (snapshot.empty) {
        break;
      }

      const batchDocuments = snapshot.docs.map((doc: { data: () => any; }) => doc.data()) as ImageMetadataI[]
      filteredBatchDocuments.push(batchDocuments);

      lastVisibleDocument = snapshot.docs[snapshot.docs.length - 1];
    }

    // Filter the current documents based on the new batch
    currentDocuments = currentDocuments.length === 0
      ? filteredBatchDocuments.flat()
      : currentDocuments.filter(doc =>
          filteredBatchDocuments.flat().some(filteredDoc => filteredDoc.imageID === doc.imageID)
        );
  }

  // Divide the final filtered documents into batches
  for (let i = 0; i < currentDocuments.length; i += batchSize) {
    allDocuments.push(currentDocuments.slice(i, i + batchSize));
  }

  return allDocuments;
}
