const nodemailer = require('nodemailer');

async function makeDevTransporter() {
  // Akun SMTP testing—dibuat otomatis oleh Ethereal
  const test = await nodemailer.createTestAccount();
  return nodemailer.createTransport({
    host: test.smtp.host,
    port: test.smtp.port,
    secure: test.smtp.secure, // true utk 465, false utk lainnya
    auth: { user: test.user, pass: test.pass },
  });
}

async function sendDonationReceipt(to, { userName, campaignTitle, amount, when }) {
  const transporter = await makeDevTransporter();

  // (opsional) cek koneksi
  await transporter.verify();

  const html = `
    <div style="font-family:Inter,Arial,sans-serif">
      <h2 style="margin:0 0 8px">Tanda Terima Donasi</h2>
      <p>Halo <b>${userName}</b>, terima kasih sudah berdonasi 🙏</p>
      <p>
        Campaign: <b>${campaignTitle}</b><br/>
        Nominal: <b>${new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(amount)}</b><br/>
        Tanggal: <b>${when}</b>
      </p>
      <hr/>
      <p style="color:#6d6f72;font-size:13px">PundiPundi</p>
    </div>
  `;

  const info = await transporter.sendMail({
    from: '"PundiPundi" <no-reply@pundipundi.test>',
    to,
    subject: `Tanda Terima Donasi — ${campaignTitle}`,
    text: `Halo ${userName}, terima kasih berdonasi untuk ${campaignTitle} sebesar ${amount}.`,
    html,
  });

  // Link untuk melihat email di web (penting untuk DEV)
  const previewUrl = nodemailer.getTestMessageUrl(info);
  return { info, previewUrl };
}

module.exports = { sendDonationReceipt };
