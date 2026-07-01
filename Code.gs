var FOLDER_ID = '1Un4aaGUtTw8jW_lrfxqsCbuEhbGyWbGH';

// ── KONFIGURASI KEAMANAN ──
var MAX_FILE_SIZE   = 10 * 1024 * 1024; // 10 MB per file
var MAX_TOTAL_SIZE  = 25 * 1024 * 1024; // 25 MB total per submission
var ALLOWED_MIME = {
  'application/pdf': true,
  'application/msword': true,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': true,
  'image/jpeg': true,
  'image/png': true
};
var MAX_SUBMISSIONS_PER_HOUR = 20;   // batas total submission masuk per jam (anti-spam massal)
var MIN_SECONDS_BETWEEN_SAME_EMAIL = 120; // cooldown submit ulang dgn email sama

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonError('Permintaan tidak valid.');
    }

    var params;
    try {
      params = JSON.parse(e.postData.contents);
    } catch (parseErr) {
      return jsonError('Format data tidak valid.');
    }

    // ── 1. VALIDASI FIELD WAJIB ──
    var nama     = sanitizeText(params.nama, 100);
    var whatsapp = sanitizeText(params.whatsapp, 20);
    var email    = sanitizeText(params.email, 100);
    var alamat   = sanitizeText(params.alamat, 300);
    var posisi   = sanitizeText(params.posisi, 80);

    if (!nama || !whatsapp || !email || !posisi) {
      return jsonError('Data wajib belum lengkap.');
    }
    if (!isValidEmail(email)) {
      return jsonError('Format email tidak valid.');
    }
    if (!isValidPhone(whatsapp)) {
      return jsonError('Format nomor WhatsApp tidak valid.');
    }

    // ── 2. ANTI-SPAM: batas submission per jam ──
    var cache = CacheService.getScriptCache();
    var hourKey = 'sub_count_' + Math.floor(Date.now() / (60 * 60 * 1000));
    var countStr = cache.get(hourKey);
    var count = countStr ? parseInt(countStr, 10) : 0;
    if (count >= MAX_SUBMISSIONS_PER_HOUR) {
      return jsonError('Terlalu banyak pengajuan saat ini. Silakan coba lagi nanti.');
    }

    // ── 3. ANTI-SPAM: cooldown per email ──
    var emailKey = 'last_sub_' + email.toLowerCase();
    var lastSub = cache.get(emailKey);
    if (lastSub) {
      var elapsed = (Date.now() - parseInt(lastSub, 10)) / 1000;
      if (elapsed < MIN_SECONDS_BETWEEN_SAME_EMAIL) {
        return jsonError('Anda baru saja mengirim lamaran. Mohon tunggu sebentar sebelum mengirim lagi.');
      }
    }

    // ── 4. VALIDASI FILE (server-side, tidak bisa di-bypass dari client) ──
    var totalSize = 0;
    var filesToCheck = [params.cv, params.ijazah, params.surat];
    for (var i = 0; i < filesToCheck.length; i++) {
      var f = filesToCheck[i];
      if (!f || !f.data) continue;

      if (!ALLOWED_MIME[f.mimeType]) {
        return jsonError('Tipe file tidak diizinkan: ' + (f.name || 'unknown'));
      }
      // estimasi ukuran asli dari base64 (base64 ~33% lebih besar dari biner)
      var approxBytes = Math.floor(f.data.length * 0.75);
      if (approxBytes > MAX_FILE_SIZE) {
        return jsonError('Ukuran file melebihi 10MB: ' + (f.name || 'unknown'));
      }
      totalSize += approxBytes;
    }
    if (totalSize > MAX_TOTAL_SIZE) {
      return jsonError('Total ukuran file melebihi batas yang diizinkan.');
    }

    // ── 5. SIMPAN KE SHEET ──
    var ss    = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Lamaran');
    if (!sheet) {
      sheet = ss.insertSheet('Lamaran');
      sheet.appendRow([
        'Timestamp', 'Nama Lengkap', 'WhatsApp', 'Email',
        'Alamat', 'Posisi',
        'URL CV', 'Nama File CV',
        'URL Ijazah', 'Nama File Ijazah',
        'URL Surat Lamaran', 'Nama File Surat Lamaran'
      ]);
      var header = sheet.getRange(1, 1, 1, 12);
      header.setFontWeight('bold');
      header.setBackground('#1E2235');
      header.setFontColor('#FFFFFF');
      sheet.setFrozenRows(1);
    }

    var folder = DriveApp.getFolderById(FOLDER_ID);
    var safeTimestamp = (params.timestamp || new Date().toISOString()).replace(/[/:]/g, '-');
    var subFolderName = safeTimestamp + '_' + nama;
    var subFolder = folder.createFolder(subFolderName);

    function uploadFile(fileData) {
      if (!fileData || !fileData.data) return { url: '-', name: '-' };
      try {
        var safeName = sanitizeText(fileData.name, 150) || 'file';
        var blob = Utilities.newBlob(
          Utilities.base64Decode(fileData.data),
          fileData.mimeType,
          safeName
        );
        var file = subFolder.createFile(blob);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        return {
          url:  'https://drive.google.com/file/d/' + file.getId() + '/view',
          name: safeName
        };
      } catch (err) {
        return { url: 'ERROR: ' + err.message, name: '-' };
      }
    }

    var cv     = uploadFile(params.cv);
    var ijazah = uploadFile(params.ijazah);
    var surat  = uploadFile(params.surat);

    sheet.appendRow([
      safeTimestamp,
      nama,
      whatsapp,
      email,
      alamat,
      posisi,
      cv.url,     cv.name,
      ijazah.url, ijazah.name,
      surat.url,  surat.name
    ]);

    sheet.autoResizeColumns(1, 12);

    // ── 6. UPDATE COUNTER ANTI-SPAM ──
    cache.put(hourKey, String(count + 1), 60 * 60); // expire 1 jam
    cache.put(emailKey, String(Date.now()), MIN_SECONDS_BETWEEN_SAME_EMAIL);

    return ContentService
      .createTextOutput(JSON.stringify({ result: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return jsonError('Terjadi kesalahan saat memproses data.');
  }
}

function doGet(e) {
  // Tidak membocorkan detail internal apapun, hanya status sederhana
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ══════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════

function jsonError(message) {
  return ContentService
    .createTextOutput(JSON.stringify({ result: 'error', message: message }))
    .setMimeType(ContentService.MimeType.JSON);
}

function sanitizeText(value, maxLen) {
  if (typeof value !== 'string') return '';
  var cleaned = value.replace(/[<>]/g, '').trim();
  return cleaned.substring(0, maxLen || 255);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone) {
  var digits = phone.replace(/[\s\-+()]/g, '');
  return /^[0-9]{8,15}$/.test(digits);
}
