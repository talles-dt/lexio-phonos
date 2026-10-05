# Sessões guiadas para brasileiros

## Escopo e evidência

20 sessões de 3–5 minutos, sete famílias, referência de inglês americano geral e instruções em português. Público de referência A2–B1; não é um diagnóstico de nível. Dezesseis sessões focalizam codas e terminações. São recortes pedagógicos que se sobrepõem, não os vinte erros mais frequentes nem dificuldades universais de brasileiros.

O currículo usa pesquisas sobre aquisição de codas (Cardoso), inteligibilidade das modificações de codas, vozeamento (Zimmer e Alves), consoantes (Osborne), dentais (Trevisol), nasais (Kluge e colaboradores), encontros (Madureira), -ed (Delatorre), fricativas/africadas (Frey) e contrastes vocálicos (Lima Jr.). As URLs por sessão constam do catálogo e podem ser abertas na interface. Não foram copiados áudios, tabelas ou materiais de avaliação desses trabalhos. As palavras, frases e instruções são propostas didáticas, não itens de um teste validado.

## Experiência

Objetivo → ouvir e observar → preparar o gesto → gravar palavras → aplicar em frase → refletir. O avanço é manual e todas as famílias ficam abertas. Cada sessão tem quatro palavras com significado/IPA opcionais, uma frase com tradução, uma instrução articulatória e uma pergunta de autorreflexão.

O aluno pode ouvir palavras individualmente, a sequência ou a frase. O modelo provisório usa exclusivamente voz local `en-US`, identificada como sintética. Ausência de voz não bloqueia a prática e não autoriza substituição por voz britânica ou remota. Não há pontuação de percepção, diagnóstico de fonemas nem detecção de epêntese. A análise verifica somente a usabilidade técnica do áudio; mesmo áudio utilizável não comprova presença de fala ou realização do alvo.

A sessão termina com duas tarefas gravadas e uma reflexão: confortável, repetir ou ainda não perceber a diferença. Não se afirma domínio. Repetir a sessão inicia nova execução e mantém o diário anterior. O áudio é temporário; pode ser reproduzido e baixado, mas não é guardado no diário nem enviado.

## Dados e compatibilidade

O catálogo guiado é separado dos 12 exercícios de prática livre e das APIs públicas legadas. Ele fornece 40 tarefas com IDs estáveis, `s01-words` a `s20-phrase`; não cria alinhamentos fonéticos artificiais. IDs e dados da prática livre permanecem válidos. O catálogo guiado não depende de banco.

O armazenamento mantém a chave `lexio-phonos-practice-v1` para continuidade e passa a gravar payload `version: 2`, com sessões e última sessão. Ler v1 migra em memória; antes da primeira escrita v2, preserva o texto original em `lexio-phonos-practice-v1-pre-sessions`. Se a cópia falhar, a escrita não ocorre. Limpar o histórico apaga também a cópia de migração. Clientes antigos não interpretam v2 como v1.

Backups v1 e v2 são aceitos; a exportação usa v2. Importações mesclam tentativas por ID; configurações e estado de uma sessão já existente no destino prevalecem. A exclusão de uma tentativa invalida a conclusão que dependia dela. Uma gravação com ID de outra sessão não comprova a tarefa. Dados inválidos não sobrescrevem o armazenamento.

O service worker v3 inclui o catálogo no shell estático. A versão nova espera as abas antigas fecharem, para não misturar recursos. Offline continua sem cache de APIs pessoais.

## Limites pedagógicos e publicação

As orientações não exigem explosão final, vozeamento contínuo ou eliminação do sotaque brasileiro. Reconhecem soltura inaudível, pistas na vogal anterior, nasalização possível, variação de /l/ e redução na fala encadeada. Explicitam sílabas legítimas em buses/wanted e o /æ/ americano antes de nasais. /ʒ/ final tem papel complementar, não prioridade equivalente a oclusivas frequentes.

A revisão de texto/IPA e os testes automatizados não substituem validação pedagógica. Antes da produção, é necessário um piloto com alunos e testes com microfones reais em Android/Chrome e iPhone/Safari. O teste de voz sintética confirma seleção/controle da API; não atesta qualidade auditiva de vozes reais. Esta entrega deve permanecer em preview até esse piloto.

## Catálogo

### 1. Fechar os lábios: /p, b/

Terminar a palavra com o fechamento dos lábios, sem criar outra sílaba.

Palavras: cap /kæp/ — boné; cab /kæb/ — táxi; cup /kʌp/ — xícara; job /dʒɑb/ — emprego.

Frase: I need a cab. /aɪ nid ə kæb/ — Preciso de um táxi.

Feche os dois lábios no final. Depois relaxe, sem acrescentar uma vogal. Não é preciso soltar o ar com força.

Reflexão: Percebi uma vogal extra depois de fechar os lábios?

Observação: Uma oclusiva pode terminar sem explosão audível. Isso não significa que ela desapareceu.

### 2. Terminar em /t, d/

Manter /t, d/ finais distintos de /tʃ, dʒ/, sem acrescentar uma sílaba.

Palavras: hat /hæt/ — chapéu; bad /bæd/ — ruim; seat /sit/ — assento; seed /sid/ — semente.

Frase: Take a seat. /teɪk ə sit/ — Sente-se.

Toque a região logo atrás dos dentes superiores com a ponta da língua para fechar a passagem de ar. Evite arrastar o final para “tch” ou “dj”.

Reflexão: Meu final virou outro som ou ganhou uma sílaba?

Observação: Na fala americana há variantes de /t/, incluindo fechamento glotal. Esta sessão explora a forma cuidadosa, sem exigir uma explosão.

### 3. Fechar atrás: /k, ɡ/

Fechar a palavra atrás da boca, sem uma vogal após /k, ɡ/.

Palavras: back /bæk/ — costas / de volta; bag /bæɡ/ — bolsa; pick /pɪk/ — escolher; big /bɪɡ/ — grande.

Frase: Take the bag. /teɪk ðə bæɡ/ — Pegue a bolsa.

Eleve a parte posterior da língua até o palato mole. Termine nesse fechamento; não reabra a boca para dizer uma vogal adicional.

Reflexão: Ouvi uma vogal depois de /k/ ou /ɡ/?

Observação: Não tente produzir um final mais forte. O fechamento pode ser pouco audível.

### 4. Ouvir o contraste: surdo e sonoro

Explorar pistas que distinguem /p–b/ e /k–ɡ/ no final.

Palavras: cap /kæp/ — boné; cab /kæb/ — táxi; back /bæk/ — de volta; bag /bæɡ/ — bolsa.

Frase: I said cab. /aɪ sɛd kæb/ — Eu disse táxi.

Alterne cap/cab e back/bag. Compare também a vogal: em contextos equivalentes, ela costuma ser mais curta antes da consoante surda. Não force vibração no final.

Reflexão: Consegui perceber alguma diferença além da força da consoante?

Observação: Duração é uma pista relativa, não uma regra de milissegundos. O app não mede acerto de vozeamento.

### 5. Ar contínuo: /f, v/

Preservar a fricção e o contraste de /f, v/ sem vogal extra.

Palavras: leaf /lif/ — folha; leave /liv/ — sair; safe /seɪf/ — seguro; save /seɪv/ — salvar.

Frase: Save the file. /seɪv ðə faɪl/ — Salve o arquivo.

Encoste levemente os dentes superiores no lábio inferior e deixe o ar passar. Compare leaf/leave: observe a fricção e a vogal anterior.

Reflexão: Mantive o final sem acrescentar outra sílaba?

Observação: Um /v/ final pode perder parte da vibração. Não sustente a garganta à força.

### 6. Sibilantes: /s, z/

Distinguir /s/ e /z/ finais em palavras com significados diferentes.

Palavras: rice /raɪs/ — arroz; rise /raɪz/ — subir; bus /bʌs/ — ônibus; buzz /bʌz/ — zumbido.

Frase: The rice is ready. /ðə raɪs ɪz ˈrɛdi/ — O arroz está pronto.

Mantenha um canal estreito para o ar perto da região atrás dos dentes. Alterne rice/rise e bus/buzz, ouvindo também a vogal anterior.

Reflexão: Rice e rise ficaram distinguíveis para mim?

Observação: Pratique primeiro a palavra isolada. A palavra seguinte pode mudar pistas acústicas na fala encadeada.

### 7. Fricção posterior: /ʃ, ʒ/

Terminar em fricção sem inserir uma vogal depois.

Palavras: fish /fɪʃ/ — peixe; wish /wɪʃ/ — desejo; beige /beɪʒ/ — bege; massage /məˈsɑʒ/ — massagem.

Frase: The bag is beige. /ðə bæɡ ɪz beɪʒ/ — A bolsa é bege.

Aproxime a parte da frente da língua da região um pouco atrás daquela usada para /s/. Deixe o ar passar sem fechar completamente.

Reflexão: A fricção terminou sem uma vogal adicional?

Observação: /ʒ/ final é menos frequente. Beige e massage ampliam o repertório; não formam um par mínimo com fish e wish.

### 8. Fechar e soltar: /tʃ, dʒ/

Preservar o fechamento seguido de fricção da africada final.

Palavras: rich /rɪtʃ/ — rico; ridge /rɪdʒ/ — crista de montanha; match /mætʃ/ — partida / fósforo; badge /bædʒ/ — crachá.

Frase: Show your badge. /ʃoʊ jʊr bædʒ/ — Mostre seu crachá.

Faça um breve fechamento da língua atrás da região alveolar e solte em fricção no mesmo gesto. Não acrescente uma vogal após a fricção.

Reflexão: Percebi o fechamento antes da fricção?

Observação: Rich/ridge é um par mínimo. Match/badge é um conjunto de prática, não um par mínimo.

### 9. Dentais: /θ, ð/

Experimentar o gesto dental, evitando trocar automaticamente o som por outra consoante.

Palavras: teeth /tiθ/ — dentes; both /boʊθ/ — ambos; breathe /brið/ — respirar; smooth /smuð/ — liso.

Frase: Breathe in. /brið ɪn/ — Inspire.

Aproxime a ponta da língua dos dentes superiores ou coloque-a ligeiramente entre os dentes. Deixe o ar passar sem morder. Compare os finais das quatro palavras.

Reflexão: Consegui manter uma passagem de ar sem fechar como /t/ ou /d/?

Observação: Breathe é verbo e termina em /ð/. Breath, o substantivo, termina em /θ/.

### 10. Fechar pelo nariz: /m, n/

Preservar a diferença entre o fechamento dos lábios e o da língua.

Palavras: sum /sʌm/ — soma; sun /sʌn/ — sol; seam /sim/ — costura; seen /sin/ — visto.

Frase: Look at the sun. /lʊk æt ðə sʌn/ — Olhe para o sol.

Para /m/, feche os lábios; para /n/, toque atrás dos dentes superiores com a língua. Em ambos, deixe o ar passar pelo nariz, sem criar uma vogal extra.

Reflexão: Percebi lugares de fechamento diferentes em sum e sun?

Observação: A vogal pode ficar nasalizada também em inglês. O objetivo é manter as pistas da consoante, não eliminar toda nasalização.

### 11. O final de sing: /ŋ/

Distinguir /n/ e /ŋ/ sem acrescentar /ɡ/ ao final de sing.

Palavras: sin /sɪn/ — pecado; sing /sɪŋ/ — cantar; thin /θɪn/ — fino; thing /θɪŋ/ — coisa.

Frase: Sing with me. /sɪŋ wɪð mi/ — Cante comigo.

Para /ŋ/, eleve a parte posterior da língua ao palato mole e deixe o ar passar pelo nariz. Termine sem uma soltura de /ɡ/.

Reflexão: Sing terminou no som nasal ou ganhou /ɡ/ e uma vogal?

Observação: Nesta referência, sing termina em /ŋ/. Isso não implica retirar /ɡ/ de todas as palavras escritas com ng, como finger.

### 12. A lateral final: /l/

Explorar a lateral final na referência americana, evitando substituí-la automaticamente por /w/.

Palavras: feel /fil/ — sentir; fill /fɪl/ — encher; full /fʊl/ — cheio; school /skul/ — escola.

Frase: I feel well. /aɪ fil wɛl/ — Eu me sinto bem.

Experimente tocar atrás dos dentes superiores com a ponta da língua e deixar o ar sair pelos lados. A parte posterior da língua pode ficar elevada.

Reflexão: Percebi um gesto lateral no final?

Observação: Há variação de /l/ entre falantes e sotaques. Esta é uma opção articulatória, não uma exigência de identidade de sotaque.

### 13. Duas obstruintes no final

Passar de uma consoante a outra sem inserir uma vogal no encontro final.

Palavras: act /ækt/ — agir; kept /kɛpt/ — guardou; desk /dɛsk/ — mesa; last /læst/ — último.

Frase: Check the desk. /tʃɛk ðə dɛsk/ — Confira a mesa.

Monte o encontro devagar: posicione o primeiro gesto e passe ao segundo. Depois diga a palavra inteira. Não é necessário soltar cada oclusiva separadamente.

Reflexão: Criei uma sílaba entre as duas consoantes?

Observação: A fala encadeada admite reduções. Aqui praticamos uma forma cuidadosa, sem tratar toda redução como erro.

### 14. Nasal ou lateral + consoante

Coordenar a nasal ou lateral com a consoante seguinte, sem acrescentar uma vogal.

Palavras: hand /hænd/ — mão; tent /tɛnt/ — barraca; help /hɛlp/ — ajuda; milk /mɪlk/ — leite.

Frase: I need help. /aɪ nid hɛlp/ — Preciso de ajuda.

Em hand/tent, passe do fechamento nasal ao final oral. Em help/milk, passe do gesto lateral ao fechamento final. Use a palavra inteira após ensaiar.

Reflexão: Mantive os dois gestos sem criar uma sílaba?

Observação: As palavras são conjuntos de prática de encontros diferentes, não pares mínimos.

### 15. O final que marca plural e rotina

Escolher /s/, /z/ ou /ɪz/ pelo som final da base, não só pela letra.

Palavras: cats /kæts/ — gatos; dogs /dɔɡz/ — cães; buses /ˈbʌsɪz/ — ônibus (plural); watches /ˈwɑtʃɪz/ — assiste / relógios.

Frase: She watches the dogs. /ʃi ˈwɑtʃɪz ðə dɔɡz/ — Ela observa os cães.

Após som surdo não sibilante, use /s/; após som sonoro não sibilante, /z/. Após /s z ʃ ʒ tʃ dʒ/, a terminação tem uma sílaba: /ɪz/.

Reflexão: Mantive a terminação e a sílaba adicional apenas onde ela é esperada?

Observação: Cats e dogs têm uma sílaba; buses e watches têm duas. Há variação legítima da vogal átona de /ɪz/.

### 16. O passado que se ouve: -ed

Distinguir /t/, /d/ e /ɪd/ em verbos regulares no passado.

Palavras: worked /wɝkt/ — trabalhou; played /pleɪd/ — brincou / jogou; wanted /ˈwɑntɪd/ — quis; needed /ˈnidɪd/ — precisou.

Frase: We worked and played. /wi wɝkt ən pleɪd/ — Nós trabalhamos e brincamos.

Após /t/ ou /d/, use a sílaba /ɪd/. Nos demais casos, use /t/ após som surdo e /d/ após som sonoro. Observe o último som, não a última letra.

Reflexão: Worked/played ficaram com uma sílaba e wanted/needed com duas?

Observação: O foco são verbos regulares. Alguns adjetivos em -ed têm pronúncias próprias. A vogal átona pode variar.

### 17. Começar pelo /s/

Começar a palavra pelo encontro consonantal, sem vogal antes do /s/.

Palavras: stop /stɑp/ — parar; school /skul/ — escola; small /smɔl/ — pequeno; street /strit/ — rua.

Frase: The school is small. /ðə skul ɪz smɔl/ — A escola é pequena.

Sustente /s/ brevemente e passe diretamente ao próximo gesto: /st/, /sk/, /sm/. Em street, una /s/, /t/ e /r/ gradualmente.

Reflexão: Minha palavra começou pelo /s/ ou por uma vogal?

Observação: Não é necessário aspirar fortemente /p t k/ após /s/ na mesma sílaba.

### 18. Duas vogais: sheep e ship

Explorar duas qualidades vocálicas em vez de usar sempre o /i/ do português.

Palavras: sheep /ʃip/ — ovelha; ship /ʃɪp/ — navio; leave /liv/ — sair; live /lɪv/ — morar.

Frase: I can see the ship. /aɪ kən si ðə ʃɪp/ — Consigo ver o navio.

Em /i/, a língua fica alta e anterior; em /ɪ/, experimente uma posição um pouco mais baixa e central. Compare o som, não apenas a duração.

Reflexão: Percebi mudança de qualidade entre sheep e ship?

Observação: Live nesta sessão é o verbo morar, /lɪv/, não o adjetivo “ao vivo”, /laɪv/.

### 19. Duas vogais: bed e bad

Distinguir /ɛ/ de /æ/ sem depender apenas da letra escrita.

Palavras: bed /bɛd/ — cama; bad /bæd/ — ruim; men /mɛn/ — homens; man /mæn/ — homem.

Frase: The man is here. /ðə mæn ɪz hɪr/ — O homem está aqui.

Para /æ/, experimente abrir um pouco mais a mandíbula e baixar a língua em relação a /ɛ/. Escute bed/bad antes de comparar men/man.

Reflexão: Bed e bad soaram diferentes sem apenas alongar a vogal?

Observação: No inglês americano, /æ/ antes de nasais pode elevar-se ou ditongar. Use bed/bad como contraste inicial mais estável.

### 20. Duas vogais: fool e full

Explorar /u/ e /ʊ/ como qualidades diferentes.

Palavras: fool /ful/ — tolo; full /fʊl/ — cheio; pool /pul/ — piscina; pull /pʊl/ — puxar.

Frase: The pool is full. /ðə pul ɪz fʊl/ — A piscina está cheia.

Para /ʊ/, experimente uma posição um pouco mais baixa e central da língua do que em /u/. Não diferencie as palavras somente alongando o som.

Reflexão: Pool e pull tiveram qualidades diferentes para mim?

Observação: A posição de /u/ varia entre falantes americanos. Os contrastes importam mais que uma posição rígida da língua.

## Verificação da implementação

Lint, TypeScript e build de produção aprovados. Passaram 29 testes unitários, quatro testes de contrato de lint e 25 testes de navegador Chromium, incluindo as sete famílias, migração v1, backup, retomada offline, voz local, silêncio e permissão de microfone. A auditoria npm não encontrou vulnerabilidades. As telas foram inspecionadas em desktop e largura móvel de 320 px. Corrigida também a retomada da preparação offline quando uma recarga ocorre entre ativação do service worker e controle da página. Microfone e voz reais em aparelhos móveis e piloto pedagógico continuam pendentes.
