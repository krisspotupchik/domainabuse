const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const { SocksProxyAgent } = require('socks-proxy-agent');
const { argv } = require('process');

if (argv.length < 9) {
    console.error('Usage: node abuse.js <smtp_host> <titles_file> <emails_file> <secure> <proxies_file> <abuse_email> <domain> <complaint_count>');
    process.exit(1);
}

const smtpHost = argv[2];
const titlesFile = argv[3];
const emailsFile = argv[4];
const secure = argv[5] === 'true';
const proxiesFile = argv[6];
const abuseEmail = argv[7];
const domain = argv[8];
const complaintCount = parseInt(argv[9], 10);

async function sendEmail(smtpConfig, to, subject, text, proxy) {
    if (!proxy.startsWith('socks5://')) {
        proxy = `socks5://${proxy}`;
    }

    const agent = new SocksProxyAgent(proxy);

    const transporter = nodemailer.createTransport({
        host: smtpConfig.host,
        port: secure ? 465 : 587,
        secure,
        auth: {
            user: smtpConfig.user,
            pass: smtpConfig.pass
        },
        socketTimeout: 60000,
        connectionTimeout: 60000,
        agent
    });

    try {
        const info = await transporter.sendMail({
            from: smtpConfig.user,
            to,
            subject,
            text
        });
        console.log(`Email sent to ${to}: ${info.messageId}`);
    } catch (err) {
        console.error(`Failed to send email to ${to}:`, err);
    }
}

async function main() {
    const titles = fs.readFileSync(titlesFile, 'utf8').split('\n').filter(Boolean);
    const emailCredentials = fs.readFileSync(emailsFile, 'utf8').split('\n').filter(Boolean);
    const proxies = fs.readFileSync(proxiesFile, 'utf8').split('\n').filter(Boolean);

    if (emailCredentials.length < complaintCount) {
        console.error('Not enough email credentials provided to match the complaint count.');
        process.exit(1);
    }

    const reportsDir = path.join(__dirname, 'reports');
    const reportFiles = fs.readdirSync(reportsDir);

    if (reportFiles.length === 0) {
        console.error('No report files found in reports directory.');
        process.exit(1);
    }

    const reportFile = reportFiles[0];
    const reportContent = fs.readFileSync(path.join(reportsDir, reportFile), 'utf8');

    for (let i = 0; i < complaintCount; i++) {
        const [smtpUser, smtpPassword] = emailCredentials[i % emailCredentials.length].split(':');
        const proxy = proxies[i % proxies.length];
        const abuseHeader = `Abuse Report for Domain: ${domain}\n\n`;

        const title = titles[i % titles.length];
        await sendEmail(
            { user: smtpUser, pass: smtpPassword, host: smtpHost },
            abuseEmail,
            title,
            abuseHeader + reportContent,
            proxy
        );
    }
}

main().catch(err => console.error('Unexpected error:', err));
