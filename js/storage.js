// storage.js — localStorage CRUD for rooms and items
const STORAGE_KEY = 'inventory-data';

export function loadRooms() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(data?.rooms) ? data.rooms : [];
  } catch {
    return [];
  }
}

export function saveRooms(rooms) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ rooms }));
}

export function addRoom(name) {
  const rooms = loadRooms();
  const room = { id: crypto.randomUUID(), name, items: [] };
  rooms.push(room);
  saveRooms(rooms);
  return room;
}

export function deleteRoom(roomId) {
  const rooms = loadRooms().filter(r => r.id !== roomId);
  saveRooms(rooms);
}

export function renameRoom(roomId, newName) {
  const rooms = loadRooms();
  const room = rooms.find(r => r.id === roomId);
  if (room) {
    room.name = newName;
    saveRooms(rooms);
  }
}

export function addItem(roomId, itemName) {
  const rooms = loadRooms();
  const room = rooms.find(r => r.id === roomId);
  if (!room) return null;
  const item = { id: crypto.randomUUID(), item: itemName, quantity: 1, category: '', notes: '' };
  room.items.push(item);
  saveRooms(rooms);
  return item;
}

export function updateItem(roomId, itemId, fields) {
  const rooms = loadRooms();
  const room = rooms.find(r => r.id === roomId);
  if (!room) return;
  const item = room.items.find(i => i.id === itemId);
  if (item) {
    Object.assign(item, fields);
    saveRooms(rooms);
  }
}

export function deleteItem(roomId, itemId) {
  const rooms = loadRooms();
  const room = rooms.find(r => r.id === roomId);
  if (!room) return;
  room.items = room.items.filter(i => i.id !== itemId);
  saveRooms(rooms);
}
