document.getElementById('password').addEventListener('input', e => {
  document.getElementById('admin').hidden = !e.target.value;
});

function log(message, color = 'black') {
  const element = document.createElement('div');
  element.innerHTML = `> ${message}`;
  element.style.color = color;
  document.getElementById('logs').appendChild(element);
}

fetch('/api/users')
  .then(v => v.json())
  .then(names => {
    const container = document.getElementById('players');

    names.forEach(name => {
      const element = document.createElement('div');
      element.id = `player-${name}`;
      element.innerHTML = `
        <span>${name}</span>
        <button onclick="deleteUser('${name}')" id="delete-${name}">Delete player</button>
      `;
      container.appendChild(element);
    });
  });

function deleteUser(name) {
  const password = document.getElementById('password').value;
  log(`Deleting '${name}'...`);

  fetch(`/api/scores/${name}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      password,
    }),
  }).then(res => {
    if (res.ok) {
      log(`Successfully deleted all entries of '${name}'.`, 'green');
      document.getElementById(`player-${name}`).hidden = true;
    } else {
      log(`Failed to delete '${name}'. Wrong / missing password?`, 'red');
    }
  });
}
