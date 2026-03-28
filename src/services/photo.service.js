const { db } = require('./firebase.service');

const PHOTOS_COLLECTION = 'photos';

async function readPhotos() {
  const snapshot = await db
    .collection(PHOTOS_COLLECTION)
    .orderBy('order', 'asc')
    .get();

  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

async function writePhotos(data) {
  const collectionRef = db.collection(PHOTOS_COLLECTION);
  const existing = await collectionRef.get();
  const incomingIds = new Set(data.map((photo) => String(photo.id)));
  const batch = db.batch();

  existing.docs.forEach((doc) => {
    if (!incomingIds.has(doc.id)) {
      batch.delete(doc.ref);
    }
  });

  data.forEach((photo, index) => {
    const id = String(photo.id);
    const payload = { ...photo, id, order: index };
    batch.set(collectionRef.doc(id), payload);
  });

  await batch.commit();
}

async function addPhoto(photo) {
  const id = String(photo.id);
  const photos = await readPhotos();
  const order = photos.length;
  await db.collection(PHOTOS_COLLECTION).doc(id).set({ ...photo, id, order });
  return { ...photo, id, order };
}

async function deletePhoto(id) {
  await db.collection(PHOTOS_COLLECTION).doc(String(id)).delete();
}

async function updatePhoto(id, data) {
  await db.collection(PHOTOS_COLLECTION).doc(String(id)).update(data);
}

module.exports = { readPhotos, writePhotos, addPhoto, deletePhoto, updatePhoto };
