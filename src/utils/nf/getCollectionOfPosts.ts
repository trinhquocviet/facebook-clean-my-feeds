export default function nf_getCollectionOfPosts(): Array<HTMLElement> {
  // -- get a collection of posts
  // -- fb serves a mixture of html structures
  // -- so, we have a set of queries to try until we have found something...
  // :: return : collection of posts.

  let posts = [];
  // -- various news feed queries

  const rootSelector = '[dir=auto]:is(h2, h3) ~ div:not([class])';

  // 2025-10-12: handle custom tag - detect customTag
  // ? is customTag -> ignore general rule
  // ? is not customTag -> ignore general rule
  const customTag = ((tagName) => {
    // customtag format [a-zA-Z0-9]+-[a-zA-Z0-9] example: ybrgmpsb-unlrhoua
    return /[a-zA-Z0-9]+-[a-zA-Z0-9]+/.test(tagName) ? tagName : '';
  })(document.querySelector(`${rootSelector} [class="x1lliihq"]:is(div, span)~*:not(div, span)`).tagName);
  

  const queries = [
    // -- grab child div in each post having a class.
    // -- nb: <details> is injected in between some <div>s - effectively kicking it out of the collection.

    // -- mostly English users:

    // ? 2025-10-12: handle custom tag
    ...(
      (customTag.length > 0)
      ? [
          Array.from({length: 10}, () => '*:is(span, div)').reduce((prv, s) => `${prv} > ${s}`, `${rootSelector} ${customTag}`)
        ]
      : [
          // Optimize:
          Array.from({length: 4}, () => '*:is(span, div)').reduce((prv, s) => `${prv} > ${s}`, `${rootSelector} [class="x1lliihq"]:is(div, span)`),
          Array.from({length: 5}, () => '*:is(span, div)').reduce((prv, s) => `${prv} > ${s}`, rootSelector),
          Array.from({length: 5}, () => '*:is(span, div)').reduce((prv, s) => `${prv} > ${s}`, `${rootSelector} > * * * * *`),
      ]
    ),

    // -- FB's April 2025 update #5:
    // 'h3[dir=auto] ~ div:not([class]) > * * * * * > div > div > div > div > div',
    // 'h2[dir=auto] ~ div:not([class]) > * * * * * > div > div > div > div > div',

    // -- FB's April 2025 update #4:
    // 'h3[dir=auto] ~ div:not([class]) > div > div > div > div > div',
    // 'h2[dir=auto] ~ div:not([class]) > span > span > span > span > span',
    // 'h2[dir=auto] ~ div:not([class]) > span > span > span > span > div',
    // 'h2[dir=auto] ~ div:not([class]) > span > span > span > div > span',
    // 'h2[dir=auto] ~ div:not([class]) > span > span > span > div > div',
    // 'h2[dir=auto] ~ div:not([class]) > span > span > div > span > span',
    // 'h2[dir=auto] ~ div:not([class]) > span > span > div > span > div',
    // 'h2[dir=auto] ~ div:not([class]) > span > span > div > div > span',
    // 'h2[dir=auto] ~ div:not([class]) > span > span > div > div > div',
    // 'h2[dir=auto] ~ div:not([class]) > span > div > span > span > span',
    // 'h2[dir=auto] ~ div:not([class]) > span > div > span > span > div',
    // 'h2[dir=auto] ~ div:not([class]) > span > div > span > div > span',
    // 'h2[dir=auto] ~ div:not([class]) > span > div > span > div > div',
    // 'h2[dir=auto] ~ div:not([class]) > span > div > div > span > span',
    // 'h2[dir=auto] ~ div:not([class]) > span > div > div > span > div',
    // 'h2[dir=auto] ~ div:not([class]) > span > div > div > div > span',
    // 'h2[dir=auto] ~ div:not([class]) > span > div > div > div > div',
    // 'h2[dir=auto] ~ div:not([class]) > div > span > span > span > span',
    // 'h2[dir=auto] ~ div:not([class]) > div > span > span > span > div',
    // 'h2[dir=auto] ~ div:not([class]) > div > span > span > div > span',
    // 'h2[dir=auto] ~ div:not([class]) > div > span > span > div > div',
    // 'h2[dir=auto] ~ div:not([class]) > div > span > div > span > span',
    // 'h2[dir=auto] ~ div:not([class]) > div > span > div > span > div',
    // 'h2[dir=auto] ~ div:not([class]) > div > span > div > div > span',
    // 'h2[dir=auto] ~ div:not([class]) > div > span > div > div > div',
    // 'h2[dir=auto] ~ div:not([class]) > div > div > span > span > span',
    // 'h2[dir=auto] ~ div:not([class]) > div > div > span > span > div',
    // 'h2[dir=auto] ~ div:not([class]) > div > div > span > div > span',
    // 'h2[dir=auto] ~ div:not([class]) > div > div > span > div > div',
    // 'h2[dir=auto] ~ div:not([class]) > div > div > div > span > span',
    // 'h2[dir=auto] ~ div:not([class]) > div > div > div > span > div',
    // 'h2[dir=auto] ~ div:not([class]) > div > div > div > div > span',
    // 'h2[dir=auto] ~ div:not([class]) > div > div > div > div > div',
    // 'h3[dir=auto] ~ div:not([class]) > span > span > span > span > span',
    // 'h3[dir=auto] ~ div:not([class]) > span > span > span > span > div',
    // 'h3[dir=auto] ~ div:not([class]) > span > span > span > div > span',
    // 'h3[dir=auto] ~ div:not([class]) > span > span > span > div > div',
    // 'h3[dir=auto] ~ div:not([class]) > span > span > div > span > span',
    // 'h3[dir=auto] ~ div:not([class]) > span > span > div > span > div',
    // 'h3[dir=auto] ~ div:not([class]) > span > span > div > div > span',
    // 'h3[dir=auto] ~ div:not([class]) > span > span > div > div > div',
    // 'h3[dir=auto] ~ div:not([class]) > span > div > span > span > span',
    // 'h3[dir=auto] ~ div:not([class]) > span > div > span > span > div',
    // 'h3[dir=auto] ~ div:not([class]) > span > div > span > div > span',
    // 'h3[dir=auto] ~ div:not([class]) > span > div > span > div > div',
    // 'h3[dir=auto] ~ div:not([class]) > span > div > div > span > span',
    // 'h3[dir=auto] ~ div:not([class]) > span > div > div > span > div',
    // 'h3[dir=auto] ~ div:not([class]) > span > div > div > div > span',
    // 'h3[dir=auto] ~ div:not([class]) > span > div > div > div > div',
    // 'h3[dir=auto] ~ div:not([class]) > div > span > span > span > span',
    // 'h3[dir=auto] ~ div:not([class]) > div > span > span > span > div',
    // 'h3[dir=auto] ~ div:not([class]) > div > span > span > div > span',
    // 'h3[dir=auto] ~ div:not([class]) > div > span > span > div > div',
    // 'h3[dir=auto] ~ div:not([class]) > div > span > div > span > span',
    // 'h3[dir=auto] ~ div:not([class]) > div > span > div > span > div',
    // 'h3[dir=auto] ~ div:not([class]) > div > span > div > div > span',
    // 'h3[dir=auto] ~ div:not([class]) > div > span > div > div > div',
    // 'h3[dir=auto] ~ div:not([class]) > div > div > span > span > span',
    // 'h3[dir=auto] ~ div:not([class]) > div > div > span > span > div',
    // 'h3[dir=auto] ~ div:not([class]) > div > div > span > div > span',
    // 'h3[dir=auto] ~ div:not([class]) > div > div > span > div > div',
    // 'h3[dir=auto] ~ div:not([class]) > div > div > div > span > span',
    // 'h3[dir=auto] ~ div:not([class]) > div > div > div > span > div',
    // 'h3[dir=auto] ~ div:not([class]) > div > div > div > div > span',
    // 'h3[dir=auto] ~ div:not([class]) > div > div > div > div > div',

    // -- FB's April 2025 update #3:
    // 'h3[dir="auto"] ~ div:not([class]) > span > span > div > div > div',
    // 'h2[dir="auto"] ~ div:not([class]) > span > span > div > div > div',

    // -- FB's April 2025 update #2:
    // 'h3[dir="auto"] ~ div:not([class]) > span > span > span > div > div',
    // 'h2[dir="auto"] ~ div:not([class]) > span > span > span > div > div',

    // -- FB's April 2025 update #1:
    // 'h3[dir="auto"] ~ div:not([class]) > span > span > span > span > div',
    // 'h2[dir="auto"] ~ div:not([class]) > span > span > span > span > div',

    // -- FB's October 2024 update #2:
    // 'h3[dir="auto"] ~ div:not([class]) > div > div > div > div > div',
    // 'h2[dir="auto"] ~ div:not([class]) > div > div > div > div > div',

    // 'h3[dir="auto"] ~ div:not([class]) .x1lliihq > div > div > div > div',
    // 'h2[dir="auto"] ~ div:not([class]) .x1lliihq > div > div > div > div',

    // -- mostly non-English users:
    'div[role="feed"] > h3[dir="auto"] ~ div:not([class]) > div[data-pagelet*="FeedUnit_"] > div > div > div > div',
    'div[role="feed"] > h2[dir="auto"] ~ div:not([class]) > div[data-pagelet*="FeedUnit_"] > div > div > div > div',

    // -- FB's October 2024 update #1:
    // 'h3[dir="auto"] ~ div:not([class]) > div[class] > div > div > div > div',
    // 'h2[dir="auto"] ~ div:not([class]) > div[class] > div > div > div > div',

  ];

  for (const query of queries) {
    const nodeList = document.querySelectorAll(query);
    if (nodeList.length > 0) {
      posts = Array.from(nodeList);
      break;
    }
  }

  return posts;
}