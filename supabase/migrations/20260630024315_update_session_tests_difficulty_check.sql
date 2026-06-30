alter table public.session_tests drop constraint session_tests_difficulty_check;
alter table public.session_tests add constraint session_tests_difficulty_check check (difficulty >= -100 and difficulty <= 100);
