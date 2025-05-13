export default function decorate(block) {
  const wrapTeaserWithLink = block.classList.contains('teaser-link-true');
  const link = block.querySelector('a');

  [...block.children].forEach((row) => {
    setupImageTeaser(row);

    if (wrapTeaserWithLink && link) {
      wrapRowWithLink(row, link.href);
      if (link.classList.contains('primary, secondary')) {
        link.parentElement.parentElement.remove();
      } else {
        link.parentElement.remove();
      }
    } else {
      row.classList.add('wrapper');
    }
  });
}

function setupImageTeaser(row) {
  const pic = row.querySelector('picture');
  if (pic) {
    const picWrapper = pic.parentElement;
    if (picWrapper && picWrapper.children.length === 1) {
      picWrapper.classList.add('teaser-img-col');
    }
  }
}

function wrapRowWithLink(row, href) {
  const anchor = document.createElement('a');
  anchor.href = href;
  anchor.classList.add('link-wrapper');

  while (row.firstChild) {
    anchor.appendChild(row.firstChild);
  }
  row.replaceWith(anchor);
}
