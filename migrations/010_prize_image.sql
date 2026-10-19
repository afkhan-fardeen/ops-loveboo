-- The guest email shows a picture of the gift won; the registration trigger sends its image URL.
alter table event_registrations add column if not exists prize_image_url text;
