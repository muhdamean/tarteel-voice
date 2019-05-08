# Tarteel-voice


The node.js micro service for Tarteel's voice recognition and follow along features.

`Note that you'll need API keys for Iqra and Google Cloud voice to run it locally. Contact one of the admins to receive them`

## Usage

Clone the repository then run:

```bash
yarn install
yarn build
yarn dev
```

`yarn dev` starts the dev server while  `yarn build` builds the code.

### Environment Setup
1. Update the `.env` file with the necessary API keys.
```bash
cp .env.example .env
```
2. Update your terminal environment to include a path to your GCloud credentials.
```bash
export GOOGLE_CLOUD_CREDENTIALS='/path/to/credentials.json'
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



