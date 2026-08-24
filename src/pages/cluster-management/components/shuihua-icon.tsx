import logo from '@/assets/providers-logo/shuihua.svg';
import React from 'react';

type ShuihuaIconProps = Omit<
  React.ImgHTMLAttributes<HTMLImageElement>,
  'src' | 'alt'
>;

/**
 * SHUIHUA FUTURE brand mark.
 *
 * TODO(shuihua): every other cluster provider renders an iconfont glyph. This
 * one ships as a plain asset so the provider does not have to wear a generic
 * cloud placeholder while the mark is not in the iconfont project yet — same
 * approach as `maas-provider`'s `ProviderLogo`. Once the glyph lands, both
 * render sites (`config/providers.ts`, `credentials.tsx`) can go back to
 * `IconFont`. The mark carries its own `#8CCCDF` fill, like `icon-aws` /
 * `icon-alicloud`, so it needs no `color` override either way.
 *
 * Sized in `em` on purpose: the two render sites differ a lot (32px in the
 * provider catalog card, 14px in the credential dropdown) and both set the
 * size through `font-size`, so the mark follows along with no per-site prop.
 *
 * `className` must be forwarded: antd's MenuItem clones the icon element to
 * inject `ant-dropdown-menu-item-icon`, and that class is what carries the
 * gap to the label (and the 12px icon size) inside a dropdown. Swallowing it
 * leaves the mark jammed against the text — `IconFont` gets this for free by
 * spreading its rest props.
 */
const ShuihuaIcon: React.FC<ShuihuaIconProps> = ({ style, ...rest }) => (
  <img
    src={logo}
    alt="SHUIHUA FUTURE logo"
    {...rest}
    style={{ width: '1em', height: '1em', display: 'block', ...style }}
  />
);

export default ShuihuaIcon;
