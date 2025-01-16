# SMTP Domain abuse script by @krisss 
# install Node.js and dependencies
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt-get install -y nodejs && npm install nodemailer socks-proxy-agent
# Usage [only socks5]
node abuse.js <smtp_host> <titles_file> <emails_file> <secure> <proxies_file> <abuse_email> <domain> <complaint_count>
# Example
node abuse.js smtp.gmail.com titles.txt emails.txt true proxies.txt abuse@namesilo.com example.com 10

The text for report messages is taken from the reports folder, you can create any number of .txt files, 1 .txt file = 1 report message.
