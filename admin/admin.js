new Vue({
  el: '#root',
  data: {
    password: '',
    playerNames: [],
    levelOptions: [...Array(31)].map((_, index) => ({
      selected: false,
      index,
    })),
    newRoomName: '',
    newRoomPublished: true,
    rooms: [],
  },
  mounted() {
    this.refresh();
  },
  computed: {
    selectedLevelsCount() {
      return this.levelOptions.filter(l => l.selected).length;
    },
    newRoomLevels() {
      return this.levelOptions
        .filter(l => l.selected)
        .map(({ index }) => index);
    },
    parsedRoom() {
      return {
        name: this.newRoomName,
        levels: this.newRoomLevels,
        published: this.newRoomPublished,
      };
    },
  },
  methods: {
    refresh() {
      axios.get('/api/users').then(({ data }) => {
        this.playerNames = data;
      });

      axios.get('/api/rooms').then(({ data }) => {
        this.rooms = data;
      });
    },
    saveRoom() {
      axios({
        url: `/api/rooms/`,
        method: 'post',
        data: {
          room: this.parsedRoom,
          password: this.password,
        },
      }).then(() => {
        this.refresh();
        this.resetRoomForm();
      });
    },
    resetRoomForm() {
      this.newRoomName = '';
      this.newRoomPublished = true;
      this.resetLevelSelections();
    },
    resetLevelSelections() {
      this.levelOptions = this.levelOptions.map(o => ({
        ...o,
        selected: false,
      }));
    },
    toggleLevelOption(levelOption) {
      levelOption.selected = !levelOption.selected;
    },
    selectRoom(room) {
      this.newRoomPublished = room.published;
      this.levelOptions = this.levelOptions.map(option => {
        option.selected = room.levels.includes(option.index);
        return option;
      });
      this.newRoomName = room.name;
    },
    deleteSelectedRoom() {
      axios({
        url: `/api/rooms/${this.newRoomName}`,
        method: 'delete',
        data: {
          password: this.password,
        },
      }).then(() => {
        this.refresh();
        this.resetRoomForm();
      });
    },
    deleteUserByName(name) {
      if (!confirm(`Really delete ${name}?`)) return;

      axios({
        url: `/api/scores/${name}`,
        method: 'delete',
        data: {
          password: this.password,
        },
      })
        .then(() => {
          this.refresh();
        })
        .catch(console.log);
    },
    pushChangesToGame() {
      axios({
        url: `/api/game`,
        method: 'post',
        data: {
          password: this.password,
        },
      });
    },
  },
});
