// Simple save implementation using fetch + async/await
const proxyBase = "http://localhost:3000"; // use proxy to avoid CORS

// Token and DB info (from your example)
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

async function saveData() {
  // basic validation
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

  console.log('PUT request payload:', payload);

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
      alert('Data saved successfully.');
    } else {
      alert('Save failed: ' + (parsed && parsed.message ? parsed.message : text));
    }
  } catch (err) {
    console.error('Save error:', err);
    alert('Save failed: ' + err.message);
  }
}

saveBtn.addEventListener('click', saveData);

// Reset behavior: clear all fields and disable buttons
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

// initial state
enableSaveIfReady();
enableResetIfReady();
