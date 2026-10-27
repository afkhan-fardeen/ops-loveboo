import { IconAd2, IconBrandInstagram, IconBuildingStore, IconMail, IconMessage, IconPhoto, IconPoint, IconStar, IconTextCaption, IconVideo, IconWorld } from "@tabler/icons-react";

export const TYPE_ICON: Record<string, typeof IconPoint> = {
  banner: IconPhoto, social_post: IconBrandInstagram, reel_video: IconVideo, email: IconMail, sms: IconMessage, ad_creative: IconAd2,
  landing_page: IconWorld, influencer: IconStar, in_store: IconBuildingStore, copy: IconTextCaption, other: IconPoint,
};
export const typeIcon = (t: string) => TYPE_ICON[t] ?? IconPoint;
