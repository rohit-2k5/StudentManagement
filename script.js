const proxyBase = "http://localhost:3000"; // use proxy to avoid CORS

// Token and DB info 
const connToken = "90935278|-31949235613722801|90958564";
const dbName = "studentsdb";
const relName = "students-Rel";

// Elements
const rollNo = document.getElementById('rollNo');
const fullName = document.getElementById('fullName');
const studentClass = document.getElementById('class');
const birthDate = document.getElementById('birthDate');
const address = document.getElementById('address');
const enrollDate = document.getElementById('enrollDate');

const saveBtn = document.getElementById('saveBtn');
const updateBtn = document.getElementById('updateBtn');
const resetBtn = document.getElementById('resetBtn');

// keep only roll numbers in localStorage
const lsRollKey = 'student_rollnos';
let currentRecNo = null; // rec_no from JPDB for the currently loaded record

function loadRollList() {
  try {
    const raw = localStorage.getItem(lsRollKey);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}
function saveRollList(list) {
  localStorage.setItem(lsRollKey, JSON.stringify(list));
}
function addRollToList(roll) {
  const list = loadRollList();
  if (!list.includes(roll)) {
    list.push(roll);
    saveRollList(list);
  }
}
function hasRollInList(roll) {
  const list = loadRollList();
  return list.includes(roll);
}



// inserting a student 
async function saveData() {
  
  if (!rollNo.value.trim() || !fullName.value.trim() || !address.value.trim()) {
    alert('Please fill required fields (Roll No, Full Name, Address).');
    return;
  }

  const payload = {
    token: connToken,
    cmd: 'PUT',
    dbName: dbName,
    rel: relName,
    jsonStr: {
      id: rollNo.value.trim(),
      Full_Name: fullName.value.trim(),
      Class: studentClass.value.trim(),
      Birth_Date: birthDate.value.trim(),
      Address: address.value.trim(),
      Enrollment_Date: enrollDate.value.trim()
    }
  };

//   console.log('PUT request payload:', payload);

  try {
    const res = await fetch(proxyBase + '/api/iml', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const text = await res.text();
    let parsed;
    try { parsed = JSON.parse(text); } catch (e) { parsed = text; }
    console.log('PUT response status=', res.status, 'body=', parsed);

    if (res.ok) {
      // store roll number locally
      const roll = rollNo.value.trim();
      addRollToList(roll);

      // try to capture rec_no returned by JPDB
      try {
        let dd = parsed && parsed.data ? parsed.data : null;
        if (typeof dd === 'string') {
          try { dd = JSON.parse(dd); } catch (e) { /* ignore */ }
        }
        if (dd && dd.rec_no) {
          currentRecNo = Array.isArray(dd.rec_no) ? dd.rec_no[0] : dd.rec_no;
        }
      } catch (e) { /* ignore */ }

      alert('Data saved successfully.');
    } else {
      alert('Save failed: ' + (parsed && parsed.message ? parsed.message : text));
    }
  } catch (err) {
    console.error('Save error:', err);
    alert('Save failed: ' + err.message);
  }

  resetForm();
}

saveBtn.addEventListener('click', saveData);


// Reset function 
function resetForm() {
  rollNo.value = '';
  fullName.value = '';
  studentClass.value = '';
  birthDate.value = '';
  address.value = '';
  enrollDate.value = '';

  saveBtn.disabled = true;
  if (updateBtn) updateBtn.disabled = true;
  if (resetBtn) resetBtn.disabled = true;

  currentRecNo = null;
  rollNo.focus();
}

if (resetBtn) resetBtn.addEventListener('click', resetForm);

// enable save button when required fields change
function enableSaveIfReady() {
  if (rollNo.value.trim() && fullName.value.trim() && address.value.trim()) {
    saveBtn.disabled = false;
  } else {
    saveBtn.disabled = true;
  }
}

[rollNo, fullName, address].forEach(el => el.addEventListener('input', enableSaveIfReady));

// enable reset button when any field has content
function enableResetIfReady() {
  if (
    rollNo.value.trim() ||
    fullName.value.trim() ||
    studentClass.value.trim() ||
    birthDate.value.trim() ||
    address.value.trim() ||
    enrollDate.value.trim()
  ) {
    resetBtn.disabled = false;
  } else {
    resetBtn.disabled = true;
  }
}

[rollNo, fullName, studentClass, birthDate, address, enrollDate].forEach(el => el.addEventListener('input', enableResetIfReady));

// Fetch record from JPDB by roll (GET_BY_KEY) and populate form; capture rec_no for updates
async function fetchStudentByRoll(roll) {
  const payload = {
    token: connToken,
    cmd: 'GET_BY_KEY',
    dbName: dbName,
    rel: relName,
    jsonStr: { id: roll }
  };

  console.log('GET_BY_KEY payload:', payload);
  try {
    const res = await fetch(proxyBase + '/api/irl', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const text = await res.text();
    let parsed;
    try { parsed = JSON.parse(text); } catch (e) { parsed = text; }
    console.log('GET_BY_KEY response=', res.status, parsed);

    if (!res.ok) return null;

    // parsed.data often contains the record (possibly stringified)
    let dataObj = parsed && parsed.data ? parsed.data : null;
    if (typeof dataObj === 'string' && dataObj.trim()) {
      try { dataObj = JSON.parse(dataObj); } catch (e) { /* ignore */ }
    }

    // dataObj may be the record itself or an object with 'record' and 'rec_no'
    let record = null;
    let rec_no = null;
    if (dataObj) {
      if (dataObj.record) {
        record = dataObj.record;
        rec_no = dataObj.rec_no || null;
      } else if (dataObj.rec_no && dataObj.record === undefined) {
        // unexpected shape; try parse parsed.data again
        record = null;
        rec_no = dataObj.rec_no;
      } else {
        // maybe parsed.data is the record directly
        record = dataObj;
      }
    }

    // fallback: some responses put rec_no at top level
    if (!rec_no && parsed && parsed.rec_no) {
      rec_no = parsed.rec_no;
    }

    // try to normalize rec_no (array -> first element)
    if (rec_no && Array.isArray(rec_no)) rec_no = rec_no[0];

    return { record, rec_no };
  } catch (err) {
    console.error('GET_BY_KEY error:', err);
    return null;
  }
}

// populate form with record object (robust keys)
function fillFormFromRecord(record) {
  if (!record) return;
  fullName.value = record.Full_Name || record.full_name || record.fullName || '';
  studentClass.value = record.Class || record.class || record.studentClass || '';
  birthDate.value = record.Birth_Date || record.birth_date || record.birthDate || '';
  address.value = record.Address || record.address || '';
  enrollDate.value = record.Enrollment_Date || record.enrollment_date || record.enrollDate || '';
}

// When rollNo input loses focus, check server for record and populate form; capture rec_no for updates
rollNo.addEventListener('blur', async () => {
  const roll = rollNo.value.trim();
  if (!roll) return;

  // Always try to fetch from server. If found, populate and enable update.
  const r = await fetchStudentByRoll(roll);
  if (r && r.record) {
    fillFormFromRecord(r.record);
    currentRecNo = r.rec_no || null;

    // ensure roll is in local list
    addRollToList(roll);

    // enable update button since record exists
    if (updateBtn) updateBtn.disabled = false;
    // disable save because record already exists
    saveBtn.disabled = true;
  } else {
    // no server record found -> treat as new
    if (updateBtn) updateBtn.disabled = true;
    currentRecNo = null;
    // clear form fields except rollNo so user can input new data
    fullName.value = '';
    studentClass.value = '';
    birthDate.value = '';
    address.value = '';
    enrollDate.value = '';

    // allow save if required fields provided
    enableSaveIfReady();
  }
});

// Update flow: send UPDATE with rec_no mapping
async function updateData() {
  if (!currentRecNo) {
    alert('No existing record selected for update.');
    return;
  }

  const updated = {
    id: rollNo.value.trim(),
    Full_Name: fullName.value.trim(),
    Class: studentClass.value.trim(),
    Birth_Date: birthDate.value.trim(),
    Address: address.value.trim(),
    Enrollment_Date: enrollDate.value.trim()
  };

  const jsonStr = {};
  jsonStr[currentRecNo] = updated;

  const payload = {
    token: connToken,
    cmd: 'UPDATE',
    dbName: dbName,
    rel: relName,
    jsonStr: jsonStr
  };

  console.log('UPDATE payload:', payload);

  try {
    const res = await fetch(proxyBase + '/api/iml', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const text = await res.text();
    let parsed;
    try { parsed = JSON.parse(text); } catch (e) { parsed = text; }
    console.log('UPDATE response=', res.status, parsed);

    if (res.ok) {
      // ensure roll is in local list
      addRollToList(rollNo.value.trim());
      alert('Data updated successfully.');
    } else {
      alert('Update failed: ' + (parsed && parsed.message ? parsed.message : text));
    }
  } catch (err) {
    console.error('Update error:', err);
    alert('Update failed: ' + err.message);
  }
}

if (updateBtn) updateBtn.addEventListener('click', updateData);

// initial state
enableSaveIfReady();
enableResetIfReady();
