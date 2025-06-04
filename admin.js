
const quotesContainer = document.getElementById('quotesContainer');
const searchInput = document.getElementById('searchInput');
const exportCsvBtn = document.getElementById('exportCsvBtn');

let allQuotes = [];
let filteredQuotes = [];

// Render all quotes
function renderQuotes(quotes) {
  quotesContainer.innerHTML = '';

  if (quotes.length === 0) {
    quotesContainer.innerHTML = '<p>No quotes found.</p>';
    return;
  }

  quotes.forEach((quote) => {
    const card = document.createElement('div');
    card.className = 'quote-card';

    // Display fields (customize based on your data structure)
    card.innerHTML = `
      <div><strong>ID:</strong> ${quote.id}</div>
      <div><strong>Name:</strong> <span class="field-name">${quote.name || ''}</span></div>
      <div><strong>Email:</strong> <span class="field-email">${quote.email || ''}</span></div>
      <div><strong>Estimate:</strong> $<span class="field-estimate">${quote.estimate || ''}</span></div>
      <div><strong>Date:</strong> ${quote.date || ''}</div>
      <button class="edit-btn">Edit</button>
      <button class="delete-btn">Delete</button>
      <div class="edit-form" style="display:none;">
        <label>Name: <input type="text" class="edit-name" value="${quote.name || ''}" /></label><br/>
        <label>Email: <input type="email" class="edit-email" value="${quote.email || ''}" /></label><br/>
        <label>Estimate: <input type="number" class="edit-estimate" value="${quote.estimate || ''}" /></label><br/>
        <button class="save-btn">Save</button>
        <button class="cancel-btn">Cancel</button>
      </div>
    `;

    // Edit button logic
    const editBtn = card.querySelector('.edit-btn');
    const deleteBtn = card.querySelector('.delete-btn');
    const editForm = card.querySelector('.edit-form');
    const saveBtn = card.querySelector('.save-btn');
    const cancelBtn = card.querySelector('.cancel-btn');

    editBtn.addEventListener('click', () => {
      editForm.style.display = 'block';
      editBtn.style.display = 'none';
      deleteBtn.style.display = 'none';
    });

    cancelBtn.addEventListener('click', () => {
      editForm.style.display = 'none';
      editBtn.style.display = 'inline-block';
      deleteBtn.style.display = 'inline-block';
    });

    saveBtn.addEventListener('click', async () => {
      const updatedName = card.querySelector('.edit-name').value.trim();
      const updatedEmail = card.querySelector('.edit-email').value.trim();
      const updatedEstimate = parseFloat(card.querySelector('.edit-estimate').value);

      if (!updatedName || !updatedEmail || isNaN(updatedEstimate)) {
        alert('Please fill all fields correctly.');
        return;
      }

      try {
        await db.collection('quotes').doc(quote.id).update({
          name: updatedName,
          email: updatedEmail,
          estimate: updatedEstimate,
          updatedAt: new Date()
        });

        // Update UI immediately
        quote.name = updatedName;
        quote.email = updatedEmail;
        quote.estimate = updatedEstimate;

        card.querySelector('.field-name').textContent = updatedName;
        card.querySelector('.field-email').textContent = updatedEmail;
        card.querySelector('.field-estimate').textContent = updatedEstimate.toFixed(2);

        editForm.style.display = 'none';
        editBtn.style.display = 'inline-block';
        deleteBtn.style.display = 'inline-block';
      } catch (error) {
        alert('Error saving changes: ' + error.message);
      }
    });

    // Delete button logic
    deleteBtn.addEventListener('click', async () => {
      if (confirm('Are you sure you want to delete this quote?')) {
        try {
          await db.collection('quotes').doc(quote.id).delete();
        } catch (error) {
          alert('Error deleting quote: ' + error.message);
        }
      }
    });

    quotesContainer.appendChild(card);
  });
}

// Real-time listener to Firestore
function setupRealtimeListener() {
  db.collection('quotes').orderBy('updatedAt', 'desc').onSnapshot(snapshot => {
    allQuotes = [];
    snapshot.forEach(doc => {
      allQuotes.push({ id: doc.id, ...doc.data() });
    });
    applySearchFilter();
  });
}

// Filter quotes by search
function applySearchFilter() {
  const term = searchInput.value.toLowerCase();
  filteredQuotes = allQuotes.filter(q =>
    (q.name && q.name.toLowerCase().includes(term)) ||
    (q.email && q.email.toLowerCase().includes(term)) ||
    (q.estimate && q.estimate.toString().includes(term))
  );
  renderQuotes(filteredQuotes);
}

// Export visible quotes to CSV
function exportToCsv() {
  if (filteredQuotes.length === 0) {
    alert('No quotes to export.');
    return;
  }

  const header = ['ID', 'Name', 'Email', 'Estimate', 'Date'];
  const rows = filteredQuotes.map(q => [
    q.id,
    `"${q.name || ''}"`,
    `"${q.email || ''}"`,
    q.estimate != null ? q.estimate.toFixed(2) : '',
    q.date || ''
  ]);

  let csvContent = header.join(',') + '\n';
  rows.forEach(row => {
    csvContent += row.join(',') + '\n';
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'quotes-export.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Event listeners
searchInput.addEventListener('input', applySearchFilter);
exportCsvBtn.addEventListener('click', exportToCsv);

// Initialize
setupRealtimeListener();
