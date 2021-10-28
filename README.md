# iframessa

Package to communicate between iframes and application.

## Install

```
npm install iframessa
```

## Usage example

Imagine you would like to receive the logged user name from your web application inside your iframe.

### 1. Emit a message to your parent window from your iframe

```javascript
const iframessa = require('iframessa');

iframessa.emitParent('getLoggedUserName');
```

This will make your parent knows what you would like.

### 2. Make your parent watch the `getLoggedUserName` event and emit the info to your iframe

```javascript
const iframessa = require('iframessa');

iframessa.onChild('getLoggedUserName', ({ data, sender, }) => {
  iframessa.emitChild(sender, 'setLoggedUserName', 'Matheus Cristian');
});
```

Note that in this case is sent a string, but you can send an object as well.

### 3. Make your iframe watch the `setLoggedUserName` event and do whatever you would like with this info

```javascript
const iframessa = require('iframessa');

iframessa.emitParent('getLoggedUserName');

iframessa.onParent('setLoggedUserName', ({ data, sender, }) => {
  console.log(data); // Matheus Cristian
  console.log(sender); // parent
});
```
