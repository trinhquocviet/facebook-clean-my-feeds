import { customisationsSectionTag } from './customisations';
import { groupFeedSectionTag } from './groupFeed';
import { marketplaceFeedSectionTag } from './marketplaceFeed';
import { newsFeedSectionTag } from './newsFeed';
import { optionsSectionTag } from './options';
import { profileAndPageSectionTag } from './profileAndPage';
import { reelsSectionTag } from './reels';
import { supplementarySectionTag } from './supplementary';
import { tipsSectionTag } from './tips';
import { videosFeedSectionTag } from './videosFeed';

const register = (): DocumentFragment => {
  const elements = document.createDocumentFragment();
  elements.append(document.createElement(newsFeedSectionTag));
  elements.append(document.createElement(groupFeedSectionTag));
  elements.append(document.createElement(marketplaceFeedSectionTag));
  elements.append(document.createElement(videosFeedSectionTag));
  elements.append(document.createElement(profileAndPageSectionTag));
  elements.append(document.createElement(supplementarySectionTag));
  elements.append(document.createElement(reelsSectionTag));
  elements.append(document.createElement(optionsSectionTag));
  elements.append(document.createElement(customisationsSectionTag));
  elements.append(document.createElement(tipsSectionTag));
  return elements;
}

export {
  register,
  newsFeedSectionTag,
  groupFeedSectionTag,
  marketplaceFeedSectionTag,
  videosFeedSectionTag,
  profileAndPageSectionTag,
  supplementarySectionTag,
  reelsSectionTag,
  optionsSectionTag,
  customisationsSectionTag,
  tipsSectionTag,
}