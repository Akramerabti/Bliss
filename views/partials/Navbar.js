document.addEventListener('DOMContentLoaded', () => {
  const settingsButton = document.getElementById('settings-button');
  const settingsDropdown = document.querySelector('.settings-dropdown');

  // When the settings button is hovered over, display the settings container
  settingsButton.addEventListener('mouseenter', () => {
    settingsDropdown.style.display = 'block';
  });

  // When the mouse leaves the settings button or container, hide the container
  settingsButton.addEventListener('mouseleave', () => {
    settingsDropdown.style.display = 'none';
  });

  settingsDropdown.addEventListener('mouseenter', () => {
    settingsDropdown.style.display = 'block';
  });

  settingsDropdown.addEventListener('mouseleave', () => {
    settingsDropdown.style.display = 'none';
  });
});