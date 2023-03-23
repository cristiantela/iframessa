const randomCharacters = () =>
  Number(Math.floor(Math.random() * 36 ** 6)).toString(36);
const generateId = () =>
  `${new Date().getTime().toString(36)}:${randomCharacters()}`;

let localName;

const modules = {};

const onEvents = [];

function emit(event, data) {
  window.parent.postMessage(
    {
      iframessaData: {
        sender: localName,
        event,
        data,
      },
    },
    "*"
  );
}

window.addEventListener("message", (event) => {
  if (event && event.data && event.data.iframessaSetting) {
    const setting = event.data.iframessaSetting;

    if (setting.event === "register") {
      modules[setting.sender] = {
        name: setting.sender,
        iframe: document.querySelector(`iframe[name=${setting.sender}]`),
        emit(event, data) {
          this.iframe.contentWindow.postMessage(
            {
              iframessaData: {
                sender: localName,
                event,
                data,
              },
            },
            "*"
          );
        },
      };
    }
  } else if (event && event.data && event.data.iframessaData) {
    const data = event.data.iframessaData;

    onEvents
      .filter(({ event: ev }) => ev === data.event)
      .forEach(({ fn }) => {
        fn({
          sender: modules[data.sender] || {
            name: "_parent",
            emit,
          },
          data: data.data,
        });
      });
  }
});

module.exports = {
  register(name) {
    localName = name;

    window.parent.postMessage(
      {
        iframessaSetting: {
          sender: localName,
          event: "register",
        },
      },
      "*"
    );
  },

  emit,

  on(event, fn) {
    onEvents.push({
      event,
      fn,
    });
  },

  get modules() {
    return modules;
  },

  getter(event, fnc) {
    onEvents.push({
      event: `getter:${event}`,
      async fn(data) {
        const response = await fnc({ ...data, data: data.data.data });
        data.sender.emit(`get:${event}:${data.data.id}`, response);
      },
    });
  },

  get(event, fn, data) {
    const id = generateId();

    emit(`getter:${event}`, {
      id,
      data,
    });

    onEvents.push({
      event: `get:${event}:${id}`,
      fn(data) {
        onEvents.splice(
          onEvents.indexOf(({ event }) => event === `get:${event}:${id}`),
          1
        );
        fn(data);
      },
    });
  },
};
