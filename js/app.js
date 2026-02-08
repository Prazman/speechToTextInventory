// app.js — Entry point, view management, event wiring
import * as storage from './storage.js';
import * as speech from './speech.js';
import { generateCSV, downloadCSV } from './export.js';

// DOM refs
const viewRoomList = document.getElementById('view-room-list');
const viewRoomDetail = document.getElementById('view-room-detail');
const speechWarning = document.getElementById('speech-warning');
const inputRoomName = document.getElementById('input-room-name');
const btnAddRoom = document.getElementById('btn-add-room');
const roomListEl = document.getElementById('room-list');
const btnExportCSV = document.getElementById('btn-export-csv');
const btnBack = document.getElementById('btn-back');
const roomNameEdit = document.getElementById('room-name-edit');
const btnMic = document.getElementById('btn-mic');
const micStatus = document.getElementById('mic-status');
const itemListEl = document.getElementById('item-list');
const inputItemName = document.getElementById('input-item-name');
const btnAddItem = document.getElementById('btn-add-item');

let currentRoomId = null;
let isRecording = false;

// --- View Management ---

function showView(view) {
  viewRoomList.classList.remove('active');
  viewRoomDetail.classList.remove('active');
  view.classList.add('active');
}

// --- Room List View ---

function renderRoomList() {
  const rooms = storage.loadRooms();
  roomListEl.innerHTML = '';
  for (const room of rooms) {
    const li = document.createElement('li');
    li.innerHTML = `
      <span class="room-name">${esc(room.name)}</span>
      <span class="room-count">${totalQty(room)} objet${totalQty(room) !== 1 ? 's' : ''}</span>
      <button class="btn-delete-room" data-id="${room.id}" aria-label="Supprimer">&times;</button>
    `;
    li.addEventListener('click', (e) => {
      if (e.target.closest('.btn-delete-room')) return;
      openRoom(room.id);
    });
    li.querySelector('.btn-delete-room').addEventListener('click', () => {
      if (confirm(`Supprimer "${room.name}" et tous ses objets ?`)) {
        storage.deleteRoom(room.id);
        renderRoomList();
      }
    });
    roomListEl.appendChild(li);
  }
}

function handleAddRoom() {
  const name = inputRoomName.value.trim();
  if (!name) return;
  storage.addRoom(name);
  inputRoomName.value = '';
  renderRoomList();
}

// --- Room Detail View ---

function openRoom(roomId) {
  currentRoomId = roomId;
  const rooms = storage.loadRooms();
  const room = rooms.find(r => r.id === roomId);
  if (!room) return;

  roomNameEdit.value = room.name;
  renderItemList(room);
  showView(viewRoomDetail);

  // Reset mic state
  stopRecording();
}

function renderItemList(room) {
  if (!room) {
    const rooms = storage.loadRooms();
    room = rooms.find(r => r.id === currentRoomId);
  }
  if (!room) return;

  itemListEl.innerHTML = '';
  for (const item of room.items) {
    appendItemToDOM(item);
  }
}

function appendItemToDOM(item) {
  const li = document.createElement('li');
  li.dataset.id = item.id;
  li.innerHTML = `
    <div class="item-row-top">
      <input class="item-name-input" type="text" value="${escAttr(item.item)}" placeholder="Objet">
      <button class="btn-delete-item" aria-label="Supprimer">&times;</button>
    </div>
    <div class="item-fields">
      <input type="number" class="field-quantity" value="${item.quantity ?? 1}" min="1" placeholder="Qté">
      <input type="text" class="field-category" value="${escAttr(item.category)}" placeholder="Catégorie">
      <input type="text" class="field-notes" value="${escAttr(item.notes)}" placeholder="Notes">
      ${speech.isSupported() ? '<button class="btn-mic-notes" aria-label="Dicter notes">🎤</button>' : ''}
    </div>
  `;

  // Inline edit — save on blur or Enter
  const nameInput = li.querySelector('.item-name-input');
  const qtyInput = li.querySelector('.field-quantity');
  const catInput = li.querySelector('.field-category');
  const notesInput = li.querySelector('.field-notes');

  const save = () => {
    storage.updateItem(currentRoomId, item.id, {
      item: nameInput.value,
      quantity: parseInt(qtyInput.value, 10) || 1,
      category: catInput.value,
      notes: notesInput.value,
    });
  };

  for (const input of [nameInput, qtyInput, catInput, notesInput]) {
    input.addEventListener('blur', save);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { save(); input.blur(); }
    });
  }

  const btnMicNotes = li.querySelector('.btn-mic-notes');
  if (btnMicNotes) {
    const stopNoteMic = () => {
      speech.stopOnce();
      btnMicNotes.classList.remove('listening');
    };

    const startNoteMic = () => {
      if (isRecording) stopRecording();
      btnMicNotes.classList.add('listening');
      speech.listenOnce('fr-FR',
        (transcript) => {
          notesInput.value = notesInput.value
            ? notesInput.value + ' ' + transcript
            : transcript;
          save();
          btnMicNotes.classList.remove('listening');
        },
        () => { btnMicNotes.classList.remove('listening'); }
      );
    };

    // Push-to-talk: hold to dictate, release to stop
    btnMicNotes.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      startNoteMic();
    });
    btnMicNotes.addEventListener('pointerup', stopNoteMic);
    btnMicNotes.addEventListener('pointerleave', stopNoteMic);
    btnMicNotes.addEventListener('pointercancel', stopNoteMic);
  }

  li.querySelector('.btn-delete-item').addEventListener('click', () => {
    storage.deleteItem(currentRoomId, item.id);
    li.remove();
  });

  itemListEl.appendChild(li);
  li.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function handleAddItem() {
  const name = inputItemName.value.trim();
  if (!name) return;
  const item = storage.addItem(currentRoomId, name);
  if (item) appendItemToDOM(item);
  inputItemName.value = '';
}

// --- Speech ---

function startRecording() {
  isRecording = true;
  btnMic.classList.add('recording');
  btnMic.textContent = '⏹';
  micStatus.textContent = 'Écoute en cours...';

  speech.startListening('fr-FR',
    (transcript) => {
      const lower = transcript.toLowerCase().trim();
      if (lower === 'stop' || lower === 'stop.') {
        stopRecording();
        return;
      }
      const item = storage.addItem(currentRoomId, transcript);
      if (item) appendItemToDOM(item);
    },
    (err) => {
      micStatus.textContent = `Erreur: ${err.error || 'inconnue'}`;
      stopRecording();
    }
  );
}

function stopRecording() {
  isRecording = false;
  speech.stopListening();
  btnMic.classList.remove('recording');
  btnMic.textContent = '🎤';
  micStatus.textContent = '';
}

// --- Room name editing ---

function handleRoomNameChange() {
  const newName = roomNameEdit.value.trim();
  if (newName && currentRoomId) {
    storage.renameRoom(currentRoomId, newName);
  }
}

// --- Utilities ---

function totalQty(room) {
  return room.items.reduce((sum, i) => sum + (parseInt(i.quantity, 10) || 1), 0);
}

function esc(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

function escAttr(str) {
  return String(str ?? '').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// --- Init ---

document.addEventListener('DOMContentLoaded', () => {
  // Speech support check
  if (!speech.isSupported()) {
    speechWarning.hidden = false;
    btnMic.style.display = 'none';
  }

  renderRoomList();

  // Room list events
  btnAddRoom.addEventListener('click', handleAddRoom);
  inputRoomName.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleAddRoom();
  });

  btnExportCSV.addEventListener('click', () => {
    const rooms = storage.loadRooms();
    const csv = generateCSV(rooms);
    downloadCSV(csv);
  });

  // Room detail events
  btnBack.addEventListener('click', () => {
    stopRecording();
    renderRoomList();
    showView(viewRoomList);
  });

  roomNameEdit.addEventListener('blur', handleRoomNameChange);
  roomNameEdit.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { handleRoomNameChange(); roomNameEdit.blur(); }
  });

  btnMic.addEventListener('click', () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  });

  btnAddItem.addEventListener('click', handleAddItem);
  inputItemName.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleAddItem();
  });
});
