export default function decorate(block) {
  const wrapper = block.querySelector('div > div');
  wrapper.classList.add('wrapper');
}
