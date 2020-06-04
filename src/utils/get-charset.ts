export const getCharset = (headers: Record<string, any>): string => {
  const contentType = headers['content-type'] || '';
  const params = contentType.split(';').reduce((params, param): any => {
    const parts = param.split('=').map((part: string): string => {
      return part.trim();
    });

    if (parts.length === 2) {
      params[parts[0]] = parts[1];
    }

    return params;
  }, {});

  return (params.charset || 'utf-8').toLowerCase();
};
