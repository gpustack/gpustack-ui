export interface FormData {
  site_name: string;
  primary_color: string;
  logo: string | null;
  logo_dark: string | null;
  mini_logo: string | null;
  mini_logo_dark: string | null;
  favicon: string | null;
  footer_name: string | null;
  footer_url: string | null;
}

export interface SiteSettings extends FormData {
  updated_at: string | null;
}
