fetch('/api/users')
  .then(v => v.json())
  .then(names => {
    const container = document.getElementById('players');

    names.forEach(name => {
      const element = document.createElement('div');
      element.innerHTML = `
          <span>${name}</span>
          <button onclick="deleteUser('${name}')">Delete from scores</button>
      `;
      container.appendChild(element);
    });
  });

function deleteUser(name) {
  const password = document.getElementById('password').value;

  fetch(`/api/scores/${name}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      password,
    }),
  }).then(() => {
    location.reload();
  });
}
