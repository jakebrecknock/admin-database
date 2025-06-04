const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let allQuotes = [];

function loadQuotes() {
  db.collection("quotes")
    .orderBy("timestamp", "desc")
    .onSnapshot((snapshot) => {
      allQuotes = snapshot.docs.map(doc => doc.data());
      displayQuotes(allQuotes);
    });
}

function displayQuotes(quotes) {
  const container = document.getElementById("quotes-container");
  container.innerHTML = "";

  if (quotes.length === 0) {
    container.innerHTML = "<p>No quotes found.</p>";
    return;
  }

  quotes.forEach((quote) => {
    const card = document.createElement("div");
    card.className = "quote-card";

    card.innerHTML = `
      <h3>${quote.name || "No Name"}</h3>
      <p><strong>Total:</strong> $${quote.total?.toFixed(2) || "N/A"}</p>
      <p><strong>Date:</strong> ${quote.timestamp?.seconds ? new Date(quote.timestamp.seconds * 1000).toLocaleString() : "N/A"}</p>
    `;

    container.appendChild(card);
  });
}

function applyFilters() {
  const nameQuery = document.getElementById("search-name").value.toLowerCase();
  const minPrice = parseFloat(document.getElementById("min-price").value) || 0;
  const maxPrice = parseFloat(document.getElementById("max-price").value) || Infinity;

  const filtered = allQuotes.filter(q =>
    (q.name || "").toLowerCase().includes(nameQuery) &&
    q.total >= minPrice && q.total <= maxPrice
  );

  displayQuotes(filtered);
}

function exportToCSV() {
  const headers = ['Name', 'Total', 'Timestamp'];
  const rows = allQuotes.map(q => [
    `"${q.name}"`,
    q.total,
    q.timestamp?.seconds ? new Date(q.timestamp.seconds * 1000).toLocaleString() : ""
  ]);

  const csv = headers.join(",") + "\n" + rows.map(r => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "quotes.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

loadQuotes();
