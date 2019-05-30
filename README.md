# Tarteel-voice


The node.js micro service for Tarteel's voice recognition and follow along features.

_Note that you'll need API keys for Iqra and Google Cloud voice to run it locally. 
Contact one of the admins to receive them_

## Usage

Clone the repository then:

```bash
yarn install
yarn build     # Build the code
yarn run test  # Run test suite
yarn dev       # Start the dev server
```

You may replace `yarn` with `npm` if you prefer.

### Environment Setup
1. Update `KEY_FILE_PATH` in `config/audioConstants.js` to point to your GCP credentials.
2. Update the `.env` with the required credentials:
```bash
cp .example.env .env
```

## Troubleshooting

### System Watch
If you run across an error like so: 
```bash
[nodemon] Internal watch failed: ENOSPC: System limit for number of file watchers reached...
```
Run the following:
```bash
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p
```

### Port Issues
If you get an address usage error
```bash
Error: listen EADDRINUSE: address already in use :::5000
```
Run
```bash
lsof -ti:3000 | xargs kill; lsof -ti:5000 | xargs kill
```
If you get an inspector address usage error
```bash
Starting inspector on 127.0.0.1:9229 failed: address already in use
```
change the `--inspect` flag in the `watch:server` script in `package.json` to another port number. 
