type Enclosure = {
  url?: string;
  length?: string;
  type?: string;
};

export type RssFeedItem = {
  author?: string;
  duration?: string;
  enclosure?: Enclosure;
  id?: string;
  image?: string;
  link?: string;
  originalURL?: string;
  subtitle?: string;
  summary?: string;
  title?: string;
  updated?: string;
  url?: string;
};
