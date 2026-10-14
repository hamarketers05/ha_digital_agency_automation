(() => {
  'use strict';

  const menuButton = document.querySelector('.menu-toggle');
  const navigation = document.querySelector('.site-nav');

  if (menuButton && navigation) {
    menuButton.addEventListener('click', () => {
      const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
      menuButton.setAttribute('aria-expanded', String(!isOpen));
      navigation.classList.toggle('is-open', !isOpen);
    });

    navigation.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        menuButton.setAttribute('aria-expanded', 'false');
        navigation.classList.remove('is-open');
      });
    });
  }

  document.querySelectorAll('[data-year]').forEach((element) => {
    element.textContent = String(new Date().getFullYear());
  });

  const form = document.querySelector('[data-brief-form]');
  if (!form) return;

  const message = document.getElementById('form-message');
  const draftPanel = document.getElementById('draft-panel');
  const draftField = document.getElementById('brief-draft');
  const copyButton = document.getElementById('copy-brief');

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const values = new FormData(form);
    const brief = [
      'HA DIGITAL AGENCY — PROJECT BRIEF',
      '',
      'Name: ' + (values.get('name') || ''),
      'Business / brand: ' + (values.get('business') || 'Not provided'),
      'Reply email: ' + (values.get('email') || 'Not provided'),
      'Service focus: ' + (values.get('service') || ''),
      '',
      'Goal / context:',
      (values.get('goal') || ''),
      '',
      'Prepared in the HA Digital Agency website brief form.'
    ].join('\n');

    const config = window.HA_SITE_CONFIG || {};
    const email = typeof config.contactEmail === 'string' ? config.contactEmail.trim() : '';

    if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      const subject = encodeURIComponent('Project enquiry — ' + (values.get('business') || values.get('name') || 'HA Digital Agency'));
      window.location.href = 'mailto:' + encodeURIComponent(email) + '?subject=' + subject + '&body=' + encodeURIComponent(brief);
      message.textContent = 'Your email app should open with the brief ready to review. Nothing has been sent automatically.';
      draftPanel.hidden = true;
      return;
    }

    draftField.value = brief;
    draftPanel.hidden = false;
    message.textContent = 'Your brief is prepared in this browser. The agency inbox is not configured yet, so no message was sent. Copy the brief and share it through your chosen contact channel.';
    draftField.focus();
  });

  if (copyButton && draftField) {
    copyButton.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(draftField.value);
        copyButton.textContent = 'Copied';
        window.setTimeout(() => { copyButton.textContent = 'Copy brief'; }, 1800);
      } catch {
        draftField.focus();
        draftField.select();
        message.textContent = 'Automatic copy was blocked by this browser. Select the brief text and copy it manually.';
      }
    });
  }
})();