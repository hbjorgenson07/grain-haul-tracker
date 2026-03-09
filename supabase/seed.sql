-- Default crop types
insert into public.crop_types (name) values
  ('Corn'),
  ('Soybeans'),
  ('Wheat'),
  ('Oats'),
  ('Sorghum');

-- Example locations (customize for your farm)
insert into public.locations (name, type) values
  ('North Field', 'field'),
  ('South Field', 'field'),
  ('East Field', 'field'),
  ('West Field', 'field'),
  ('Home Bins', 'bin_site'),
  ('Elevator', 'elevator');

-- Example trucks (customize for your fleet)
insert into public.trucks (name) values
  ('Truck 1'),
  ('Truck 2'),
  ('Truck 3');
