import { spawn } from 'child_process';
import yaml from 'yaml';
import fs from 'fs';
import fetch from 'node-fetch';

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function checkReachable(url) {
    const res = await fetch(url, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: `{ "query": "query {__schema {__typename}}" }`,
    });
    return res.ok;
}

// get urls of services we need to wait for
const meshRc = fs.readFileSync('./.meshrc.yaml', 'utf8');
const config = yaml.parse(meshRc);

// replace env variables in urls
const serviceEndpoints = []
const reEnv = /{env\.(.+)}/g
for (const service of config.sources) {
    let url = service.handler.graphql.endpoint;
    if (url) {
        url = url.replace(reEnv, (_, envVar) => {
            return process.env[envVar] || '';
        });
        serviceEndpoints.push({
            name: service.name,
            url: url,
        });
    }
}

// wait for urls to be reachable
while (true) {
    const notReachable = [];
    for(const service of serviceEndpoints) {
        try {
            const reachable = await checkReachable(service.url);
            if (!reachable) {
                notReachable.push(service.name);
            }
        } catch (error) {
            console.log('Failed trying to reach service:', error.message);
            notReachable.push(service.name);
        }
    }

    if (notReachable.length === 0) {
        break;
    } else {
        console.log('Waiting for services to be reachable:', notReachable.join(', '));
    }
    console.log('Retrying in 5 seconds...');
    await sleep(5000);
}

console.log('All services are reachable, starting mesh after 2 seconds...');
await sleep(2000); // additional wait to ensure services are ready

// run mesh
const meshProcess = spawn('npx', ['mesh', 'dev'], {
    stdio: 'inherit',
    shell: true,
});

meshProcess.on('close', (code) => {
    console.log(`Mesh process exited with code ${code}`);
    process.exit(code ?? 0);
});