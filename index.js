const randomCharacters = () => Number(Math.floor(Math.random() * 36 ** 6)).toString(36);
const generateId = () => `${(new Date()).getTime().toString(36)}:${randomCharacters()}`;

let localId = null;

let emitsParent = [];

const onEvents = [];

const emitParent = (eventName, data) => {
  if (!localId) {
    emitsParent.push({ eventName, data });
    return;
  }

  if (window !== window.parent) {
    window.parent.postMessage({
      iframessa: {
        sender: localId,
        event: eventName,
        data,
      }
    }, '*');
  }
}

const emitChild = (destiny, eventName, data) => {
  for (let i = 0; i < window.frames.length; i++) {
    const { frameElement } = window.frames[i];

    if (frameElement.getAttribute('iframessa-id') === destiny) {
      frameElement.contentWindow.postMessage({
        iframessa: {
          event: eventName,
          sender: 'parent',
          data,
        },
      });
    }
  }
}

if (window !== window.parent) {
  window.parent.postMessage({
    iframessa: {
      event: '_loaded',
    },
  }, '*');
}

window.addEventListener('message', (event) => {
  if (event && event.data && event.data.iframessa) {
    const data = event.data.iframessa;

    if (data.event === '_loaded') {
      for (let i = 0; i < window.frames.length; i++) {
        const { frameElement } = window.frames[i];

        if (String(frameElement.getAttribute('iframessa-status')) !== 'confirmed') {
          const iframeId = generateId();

          frameElement.setAttribute('iframessa-id', iframeId);
          frameElement.setAttribute('iframessa-status', 'waiting');

          frameElement.contentWindow.postMessage({
            iframessa: {
              event: '_setLocalId',
              localId: iframeId,
            },
          });
        }
      }
    } else if (data.event === '_setLocalId') {
      localId = data.localId;

      window.parent.postMessage({
        iframessa: {
          event: '_confirmLocalId',
          sender: localId,
        }
      }, '*');
    } else if (data.event === '_confirmLocalId') {
      for (let i = 0; i < window.frames.length; i++) {
        const { frameElement } = window.frames[i];

        if (frameElement.getAttribute('iframessa-id') === data.sender) {
          frameElement.setAttribute('iframessa-status', 'confirmed');

          frameElement.contentWindow.postMessage({
            iframessa: {
              event: '_canInit',
            },
          });
        }
      }
    } else if (data.event === '_canInit') {
      if (emitsParent.length) {
        emitsParent.forEach(({ eventName, data }) => {
          emitParent(eventName, data);
        });

        emitsParent = [];
      }
    } else if (data.event.startsWith('_getParent_')) {
      const getName = data.event.replace(/^_getParent_[^_]+_/, '');
      onEvents.forEach((on) => {
        if (on.event === `_getter_${getName}`) {
          const response = on.data({ data: data.data, sender: data.sender, });

          emitChild(data.sender, data.event.replace(/^_getParent_/, '_getParent.response_'), response);
        }
      });
    } else {
      onEvents.forEach((on) => {
        if (on.event === data.event) {
          on.data({ data: data.data, sender: data.sender, });
        }
      });
      // console.log(data);
    }
  }
});

module.exports = {
  emitParent,

  onChild: function (eventName, data) {
    onEvents.push({
      event: eventName,
      data,
    })
  },

  onParent: function (eventName, data) {
    onEvents.push({
      event: eventName,
      data,
    })
  },

  emitChild,

  getParent(name, data) {
    const eventName = `_getParent_${randomCharacters()}_${name}`;

    emitParent(eventName, data);

    return new Promise((resolve) => {
      onEvents.push({
        event: eventName.replace(/^_getParent_/, '_getParent.response_'),
        data: (response) => {
          onEvents.splice(onEvents.findIndex((on) => (on.eventName === eventName.replace(/^_getParent_/, '_getParent.response_'))), 1);
          resolve(response);
        },
      });
    });
  },

  getterChild(name, get) {
    onEvents.push({
      event: `_getter_${name}`,
      data: get,
    });
  },
}
