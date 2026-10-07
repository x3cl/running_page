interface ISiteMetadataResult {
  siteTitle: string;
  siteUrl: string;
  description: string;
  logo: string;
  navLinks: {
    name: string;
    url: string;
  }[];
}

const getBasePath = () => {
  const baseUrl = import.meta.env.BASE_URL || '';
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
};

const rawData: ISiteMetadataResult = {
  siteTitle: 'Garmin Running Page',
  siteUrl: 'https://yihong.run',
  logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQTtc69JxHNcmN1ETpMUX4dozAgAN6iPjWalQ&usqp=CAU',
  description: 'Personal sports page',
  navLinks: [
    {
      name: 'Annual',
      url: `${getBasePath()}/annual`,
    },
    {
      name: 'Summary',
      url: `${getBasePath()}/summary`,
    },
    {
      name: 'About',
      url: 'https://github.com/yihong0618/running_page/blob/master/README-CN.md',
    },
  ],
};

const getSiteData = (): ISiteMetadataResult => {
  if (typeof window !== 'undefined' && (window as any).__SITE_METADATA__) {
    return { ...rawData, ...(window as any).__SITE_METADATA__ };
  }
  return rawData;
};

export default getSiteData();

