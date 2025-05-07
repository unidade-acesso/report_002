const axios = require('axios');

const token = process.env.GITHUB_TOKEN;
const owner = process.env.REPO_OWNER;
const repo = process.env.REPO_NAME;

const api = axios.create({
  baseURL: 'https://api.github.com',
  headers: {
    Authorization: `token ${token}`,
    Accept: 'application/vnd.github.inertia-preview+json'
  }
});

async function getRepoDescription() {
  const { data } = await api.get(`/repos/${owner}/${repo}`);
  return data.description || 'Novo';
}

async function getTemplateProject() {
  const { data: projects } = await api.get(`/repos/${owner}/Projeto-Template/projects`);
  return projects.find(p => p.name.includes('[Template]'));
}

async function getColumns(projectId) {
  const { data } = await api.get(`/projects/${projectId}/columns`);
  return data;
}

async function getCards(columnId) {
  const { data } = await api.get(`/projects/columns/${columnId}/cards`);
  return data;
}

async function createProject(name) {
  const { data } = await api.post(`/repos/${owner}/${repo}/projects`, {
    name: name,
    body: 'Clonado de Projeto [Template]'
  });
  return data;
}

async function createColumn(projectId, name) {
  const { data } = await api.post(`/projects/${projectId}/columns`, { name });
  return data;
}

async function createCard(columnId, note) {
  await api.post(`/projects/columns/${columnId}/cards`, { note });
}

(async () => {
  try {
    const description = await getRepoDescription();
    const templateProject = await getTemplateProject();
    if (!templateProject) {
      console.error('❌ Projeto template não encontrado.');
      return;
    }

    const newProjectName = templateProject.name.replace('[Template]', description);
    const newProject = await createProject(newProjectName);
    const columns = await getColumns(templateProject.id);

    for (const column of columns) {
      const newColumn = await createColumn(newProject.id, column.name);
      const cards = await getCards(column.id);
      for (const card of cards) {
        if (card.note) {
          await createCard(newColumn.id, card.note);
        }
      }
    }

    console.log('✅ Projeto clonado com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao clonar o projeto:', error.message);
  }
})();
