# iframessa

Package to communicate between iframes and application.

## Install

```
npm install iframessa
```

## Usage examples

### Case 1: You would like to receive the logged user name from your web application into your iframe.

#### 1. Create a getter on your parent window

```html
<iframe src="about.html" name="about"></iframe>
```

```javascript
const iframessa = require('iframessa');

iframessa.getter('userName', ({ data, sender }) => {
  return 'Matheus Cristian';
});
```

#### 2. Call the getter on your child window

```javascript
const iframessa = require('iframessa');

iframessa.register('about');

iframessa.get('userName').then(({ data, sender }) => {
  console.log(data); // Matheus Cristian
  console.log(sender); // parent object
}, data);
```

### Case 2: You would like to emit an event with a data from your child window to your parent

#### 1. Emit a message to your parent window from your iframe

```javascript
const iframessa = require('iframessa');

iframessa.emit('action', 'logout');
```

This will emit a `'action'` event to your parent with the data `'logout'`.
Note that the data can be an object as well.

#### 2. Make your parent watch the `'action'` event

```javascript
const iframessa = require('iframessa');

iframessa.on('action', ({ data, sender }) => {
  console.log(data); // logout
});
```

You can emit something to a specific child window with `iframessa.modules.about.emit(event, data);`
