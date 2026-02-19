async function encryptData() {
  const text = document.getElementById("textInput").value;
  const file = document.getElementById("fileInput").files[0];

  const formData = new FormData();

  if (file) {
    formData.append("file", file);
  } else {
    formData.append("text", text);
  }

  const res = await fetch("http://localhost:5000/encrypt", {
    method: "POST",
    body: formData,
  });

  const data = await res.json();

  document.getElementById("cipherText").value = data.cipherText || "";
  document.getElementById("secretKey").value = data.key || "";
}

async function decryptData() {
  const cipherText = document.getElementById("decryptCipher").value;
  const key = document.getElementById("decryptKey").value;

  const res = await fetch("http://localhost:5000/decrypt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cipherText, key }),
  });

  const data = await res.json();

  if (data.qrImage) {
    document.getElementById("qrResult").innerHTML =
      `<img src="${data.qrImage}" />`;
  } else {
    alert("Decryption failed!");
  }
}

function removeFile() {
  document.getElementById("fileInput").value = "";
  alert("Selected file removed!");
}

async function generateLink() {
  const file = document.getElementById("linkFileInput").files[0];

  if (!file) {
    alert("Please select a file!");
    return;
  }

  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch("/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (data.fileUrl) {
      document.getElementById("generatedLink").value = data.fileUrl;
    } else {
      alert("Link generation failed!");
    }

  } catch (error) {
    console.error("Fetch error:", error);
    alert("Server not responding!");
  }
}


