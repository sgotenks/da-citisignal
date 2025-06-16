import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {

  const promo = block.classList.contains('promo-cards');

  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    while (row.firstElementChild) li.append(row.firstElementChild);

    if (promo) {
      const tag = li.firstElementChild.querySelector('h5');
      if (tag) {
        tag.classList.add('cards-card-tag');
        li.lastElementChild.insertBefore(tag, li.lastElementChild.firstElementChild);
      }
      const picture = li.firstElementChild.querySelector('picture');
      if (picture) {
        picture.classList.add('cards-card-image');
        li.lastElementChild.append(picture);
      }
      if (li.firstElementChild.textContent?.trim() === '') {
        li.firstElementChild.remove();
      }
    }

    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-card-image';
      else div.className = 'cards-card-body';
    });
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });
  block.textContent = '';
  block.append(ul);
}
