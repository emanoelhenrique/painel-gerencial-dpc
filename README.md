# 📊 Painel Gerencial DPC: Dashboard Logístico e Automação de Turnos

## 📌 O Problema
A gestão da operação no setor logístico envolvia o acompanhamento de múltiplas bases de dados distintas (Controle de Paletes, Recebimento e Produtividade). A passagem de turno era um processo manual e demorado: o operador precisava extrair dados de diferentes fontes, redigir e-mails do zero e calcular a produtividade diária. Além disso, faltava uma visão centralizada e em tempo real sobre o SLA (tempo de atendimento) dos paletes e a ocupação física da doca.

## 💡 A Solução
Desenvolvi um **Web App Gerencial** integrado diretamente ao menu nativo do Google Sheets, utilizando **Google Apps Script**. A ferramenta unifica dados de diferentes planilhas e do Google Drive, oferecendo uma interface profissional para monitoramento de KPIs, controle de fila e automação completa da comunicação entre turnos.

### Funcionalidades Principais:
* **Automação de Passagem de Turno:** Com um único clique, o sistema compila as atividades descritas, cruza com os gráficos de produtividade do dia, busca os paletes finalizados em outras bases e envia um e-mail HTML formatado para a gestão.
* **Gestão de SLA e Fila:** Monitoramento em tempo real dos paletes pendentes, detalhando processo, saldo de peças e tempo limite de atuação (SLA).
* **Dashboard Inteligente (Analytics):** Aba dedicada com gráficos dinâmicos (Chart.js) que mostram tendências de triagem por dia/semana, saídas por processo e análises de entrada vs. saída, incluindo filtros de data e multi-seleção de processos.
* **Medidores de Ocupação (Gauges):** Indicadores visuais do acumulado atual na doca em comparação com o volume a ser recebido, facilitando a tomada de decisão.
* **Integração com Google Drive:** O painel rastreia e atualiza automaticamente o número do formulário vigente lendo os arquivos direto da nuvem.

## 🛠️ Tecnologias Utilizadas
* **Backend & Integração:** Google Apps Script, Google Drive API, Gmail API.
* **Frontend:** HTML5, CSS3, JavaScript.
* **Visualização de Dados:** Chart.js (com DataLabels e plugins customizados).
* **Banco de Dados:** Google Sheets (Múltiplas planilhas interligadas).

## 📊 Demonstração Visual

<img width="1912" height="903" alt="image" src="https://github.com/user-attachments/assets/166e8231-5a50-4e23-bf00-596f8b9b47dd" />

> **Visão Operacional e SLA:** Controle de paletes pendentes, status de processos, medidores de ocupação e gerador automático de e-mail de passagem de turno.

<img width="1900" height="906" alt="image" src="https://github.com/user-attachments/assets/94330ba9-d318-43aa-95cb-975242affd75" />

> **Dashboard Inteligente:** Análise de dados em tempo real com gráficos de produtividade diária, semanal e filtros avançados.

## 🚀 Impacto e Resultados
* **Eficiência na Comunicação:** Redução a zero do tempo gasto na formatação de e-mails de passagem de turno, eliminando esquecimentos e erros de digitação.
* **Visibilidade Estratégica:** Gestores e operadores agora possuem uma "torre de controle" única, não precisando mais abrir 3 ou 4 ferramentas diferentes para entender o status da operação.
* **Decisões Baseadas em Dados:** O acompanhamento de tendências através dos gráficos permitiu identificar gargalos de processos (ex: dias com menor saída de paletes) de forma imediata.
