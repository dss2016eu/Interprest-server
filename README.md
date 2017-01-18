# interpest-server

## Installation
* Clone this repo
* `cd interprest-server && npm install`

## Configuration
* Copy `env_example` file to `.env` and change variable values.

|var|description|example|
|---|---|---|
|PRIVATE_IP|Private API IP|`192.168.1.2`|
|PRIVATE_PORT|Private API port|`1337`|
|PRIVATE_URL|Private API URL|`private.interprest`|
|PUBLIC_IP|Public API IP|`192.168.1.2`|
|PUBLIC_PORT|Public API port|`3001`|
|PUBLIC_URL|Public API URL|`public.interprest`|
|STREAMS_DIR|Stream config files dir|`/home/interprest/streams`|
|IMAGES_DIR|Image files dir|`/home/interprest/images`|
|COOKIE_SECRET|Private APi Cookie secret|`sososecret`|

## Run
* Execute `node index.js`
