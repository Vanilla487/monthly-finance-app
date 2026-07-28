const response = await fetch('http://localhost:3000/api/rules', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    substring: 'SPOTIFY',
    displayName: 'Spotify',
    categoryId: 5
  })
})
console.log(await response.json())