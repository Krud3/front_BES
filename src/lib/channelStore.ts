let globalChannelId: string | null = null;

export const setChannelId = (id: string): void => {
  globalChannelId = id;
  console.log("Channel ID stored:", id);
};

export const getChannelId = (): string | null => {
  return globalChannelId;
};

export const clearChannelId = (): void => {
  globalChannelId = null;
};
