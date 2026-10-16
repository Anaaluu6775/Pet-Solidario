const $ = (s) => document.querySelector(s);
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch { return d; } };
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; };

const DEFAULT_CAMPOS = ['Abrigo de animais', 'Adoção de animais', 'Resgate', 'Proteção'];
const campos = () => load('ps_campos', DEFAULT_CAMPOS);
const entidades = () => load('ps_entidades', []);

function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}
const flash = sessionStorage.getItem('ps_flash');
if (flash) { sessionStorage.removeItem('ps_flash'); toast(flash); }

function fillSelect(placeholder, selected = '') {
  const s = $('#select-field');
  s.replaceChildren(new Option(placeholder, ''));
  campos().forEach((c) => s.add(new Option(c, c)));
  s.value = selected;
}
function setErro(input, msgEl, msg) {
  msgEl.textContent = msg; input.classList.toggle('invalido', !!msg);
}

const pages = {
  cadastro() {
    fillSelect('Selecione uma opção');
    let pontos = [];
    const chips = $('#chips'), input = $('#input-points');
    const render = () => {
      chips.replaceChildren(...pontos.map((p, i) => {
        const li = el('li', '', p), b = el('button', '', '×');
        b.type = 'button'; b.setAttribute('aria-label', 'Remover ' + p);
        b.onclick = () => { pontos.splice(i, 1); render(); };
        li.append(b); return li;
      }));
    };
    const addPonto = () => {
      const v = input.value.trim();
      if (v && !pontos.includes(v)) { pontos.push(v); render(); }
      input.value = ''; input.focus();
    };
    $('#add-point').onclick = addPonto;
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); addPonto(); } });

    $('#form-entidade').addEventListener('submit', (e) => {
      e.preventDefault();
      if (input.value.trim()) addPonto();
      const nome = $('#input-name'), campo = $('#select-field');
      setErro(nome, $('#erro-name'), nome.value.trim() ? '' : 'Informe o nome da entidade.');
      setErro(campo, $('#erro-field'), campo.value ? '' : 'Escolha um campo de atuação.');
      if (!nome.value.trim() || !campo.value) return;
      const lista = entidades();
      lista.push({ id: Date.now(), nome: nome.value.trim(), campo: campo.value, pontos });
      save('ps_entidades', lista);
      sessionStorage.setItem('ps_flash', 'Entidade cadastrada!');
      location.href = 'entidades-cadastradas.html';
    });
  },

  campo() {
    fillSelect('Selecione um campo');
    const sel = $('#select-field'), res = $('#resultado');
    const mostrar = () => {
      res.replaceChildren();
      if (!sel.value) return;
      const lista = entidades().filter((x) => x.campo === sel.value);
      if (!lista.length) res.append(el('li', 'vazio', 'Nenhuma entidade neste campo ainda.'));
      lista.forEach((x) => res.append(el('li', '', x.nome)));
    };
    sel.onchange = mostrar;
    $('#form-campo').addEventListener('submit', (e) => {
      e.preventDefault();
      const input = $('#input-campo'), nome = input.value.trim();
      const existe = campos().some((c) => c.toLowerCase() === nome.toLowerCase());
      setErro(input, $('#erro-campo'), !nome ? 'Digite o nome do novo campo.' : existe ? 'Esse campo já existe.' : '');
      if (!nome || existe) return;
      save('ps_campos', [...campos(), nome]);
      input.value = ''; fillSelect('Selecione um campo', nome); mostrar();
      toast('Campo cadastrado!');
    });
  },

  lista() {
    fillSelect('Todos os campos');
    const ul = $('#lista'), dlg = $('#dialog'), sel = $('#select-field');
    const render = () => {
      const itens = entidades().filter((x) => !sel.value || x.campo === sel.value);
      ul.replaceChildren();
      if (!itens.length) {
        ul.append(el('li', 'vazio', sel.value ? 'Nenhuma entidade neste campo.' : 'Nenhuma entidade cadastrada ainda.'));
        return;
      }
      itens.forEach((x) => {
        const li = el('li'), info = el('div'), b = el('button', 'ver', 'Ver dados');
        info.append(el('strong', '', x.nome), el('span', 'tag', x.campo));
        b.onclick = () => abrir(x);
        li.append(info, b); ul.append(li);
      });
    };
    const abrir = (x) => {
      dlg.replaceChildren(el('h3', '', x.nome), el('span', 'tag', x.campo), el('h4', '', 'Pontos de coleta'));
      if (x.pontos.length) { const l = el('ul'); x.pontos.forEach((p) => l.append(el('li', '', p))); dlg.append(l); }
      else dlg.append(el('p', 'vazio', 'Nenhum ponto informado.'));
      const fechar = el('button', 'btn btn-primary', 'Fechar'), del = el('button', 'btn btn-perigo', 'Excluir');
      fechar.onclick = () => dlg.close();
      del.onclick = () => {
        if (!confirm('Excluir "' + x.nome + '"?')) return;
        save('ps_entidades', entidades().filter((e) => e.id !== x.id));
        dlg.close(); render(); toast('Entidade excluída.');
      };
      const a = el('div', 'dlg-actions'); a.append(del, fechar); dlg.append(a);
      dlg.showModal();
    };
    dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
    sel.onchange = render; render();
  },
};
const fn = pages[document.body.dataset.page];
if (fn) fn();