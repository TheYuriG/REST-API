# REST-API

Rest API to handle backend for the Twitter-like feed. To properly use this, you must also run the [frontend repository](https://github.com/TheYuriG/REST-frontend) so they can talk to each other, as they are independent on runtime, but needed to be functional.

## Before starting

You need a MongoDB account and database to store and access the posts. Once done, register your API key at `util/secret/keys.js` using the following format:

```js
module.exports.mongoKey = 'YOUR_API_KEY_HERE';
```

After that is done, run with `npm start` and you are good to go. Access the frontend page at `http://localhost:3000/` and test away CRUDing posts as you please.
