-- Zdalny "wyłącznik" konta (Paweł, 2026-09-12) — przygotowanie pod
-- przyszłą wersję płatną: sposób na natychmiastowe odcięcie konta, które
-- nie zapłaciło (albo złamało zasady), bez wydawania nowej wersji apki.
--
-- Mechanizm: `accounts.status` + funkcja `account_is_active()` (SECURITY
-- DEFINER, ten sam sprawdzony wzorzec co w 0011/0012 — omija RLS przy
-- odpytywaniu accounts, więc nie ma ryzyka rekursji) + RESTRICTIVE policy
-- na każdej tabeli, na której odbywa się realne korzystanie z aplikacji.
--
-- RESTRICTIVE (nie PERMISSIVE) to kluczowy wybór: taka polityka jest
-- łączona przez AND ze wszystkimi innymi politykami na tej tabeli, więc
-- NIE trzeba dotykać/nadpisywać żadnej z istniejących polityk właściciela
-- — wystarczy dołożyć jedną dodatkową politykę per tabela. To też ułatwia
-- rozszerzenie na kolejne tabele w przyszłości (dokładnie ten sam wzorzec,
-- zero ryzyka zepsucia czegoś istniejącego).
--
-- Świadomie NIE dotykamy tabeli `accounts` samej w sobie — zawieszone
-- konto musi dalej móc odczytać WŁASNY wiersz (żeby apka mogła pokazać
-- ekran "Konto zawieszone" zamiast błędu RLS i żeby AuthContext.jsx nie
-- pomylił zawieszonego konta z "nowym użytkownikiem bez wiersza w
-- accounts" i nie spróbował go utworzyć od nowa).
--
-- `tournaments` i `city_coordinates` też świadomie pominięte — to wspólne
-- dane referencyjne, nie "korzystanie z usługi" w sensie, który ma być
-- odcięty.

alter table accounts
  add column status text not null default 'active' check (status in ('active', 'suspended'));

create or replace function account_is_active()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((select status = 'active' from accounts where id = auth.uid()), false);
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'players', 'trips',
    'ride_offers', 'ride_requests', 'ride_join_requests',
    'lodging_offers', 'lodging_join_requests',
    'conversations', 'conversation_participants', 'messages'
  ]
  loop
    execute format(
      'drop policy if exists "Zawieszone konto nie ma dostępu" on %I;
       create policy "Zawieszone konto nie ma dostępu"
         on %I as restrictive for all to authenticated
         using (account_is_active())
         with check (account_is_active());',
      t, t
    );
  end loop;
end $$;
