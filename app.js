const tableBody = document.getElementById('packageTable').getElementsByTagName('tbody')[0];
const checkButton = document.getElementById('checkBtn');
const jsonInput = document.getElementById('jsonInput');
const loadingIndicator = document.getElementById('loading');

checkButton.addEventListener('click', async () => {
    // Clear the table and show loading indicator
    tableBody.innerHTML = '';
    loadingIndicator.style.display = 'block';

    // Get user input and parse it
    let dependencies;
    try {
        dependencies = JSON.parse(jsonInput.value);
    } catch (error) {
        alert('Invalid JSON. Please paste a valid dependencies JSON.');
        loadingIndicator.style.display = 'none';
        return;
    }

    await checkPackages(dependencies);

    // Hide loading indicator
    loadingIndicator.style.display = 'none';
});

async function checkPackages(dependencies) {
    for (const [packageName, currentVersion] of Object.entries(dependencies)) {
        try {
            // Fetch the latest version details from npm registry
            const response = await fetch(`https://registry.npmjs.org/${packageName}`);
            const data = await response.json();

            const latestVersion = data['dist-tags'].latest;
            const repository = data.repository?.url;

            // Fetching what's new from GitHub
            let whatsNew = "No specific new features listed.";
            if (repository) {
                const repoInfo = parseRepositoryURL(repository);
                if (repoInfo) {
                    whatsNew = await fetchLatestReleaseOrChangelog(repoInfo.owner, repoInfo.repo);
                }
            }

            // Convert Markdown to HTML using marked
            const whatsNewHtml = marked.parse(whatsNew);

            // Checking for vulnerabilities (Simulated for demonstration)
            const vulnerability = await checkVulnerabilities(packageName, currentVersion);

            // Insert a new row in the table
            const row = tableBody.insertRow();
            row.innerHTML = `
                <td width="20%">${packageName}</td>
                <td width="10%">${currentVersion}</td>
                <td width="10%">${latestVersion}</td>
                <td width="10%">${vulnerability}</td>
                <td width="50%"><div class="markdown-body">${whatsNewHtml}</div></td>
            `;
        } catch (error) {
            console.error(`Error fetching data for package: ${packageName}`, error);
        }
    }
}

// Function to parse the repository URL and extract owner and repo
function parseRepositoryURL(url) {
    const match = url.match(/github\.com[/:]([^/]+)\/([^/]+)(\.git)?/);
    if (match) {
        return {
            owner: match[1],
            repo: match[2].replace(/\.git$/, '')
        };
    }
    return null;
}

// Function to fetch the latest release or changelog from GitHub
async function fetchLatestReleaseOrChangelog(owner, repo) {
    const GITHUB_TOKEN = "add your github token for accessing public repos"
    try {
        // Fetch the latest release from GitHub
        const releaseResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases/latest`, {
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`
            }
        });

        if (releaseResponse.ok) {
            const releaseData = await releaseResponse.json();
            return releaseData.body || "No release notes available.";
        } else {
            // Fallback: Fetch the CHANGELOG.md file if available
            const changelogResponse = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/main/CHANGELOG.md`, {
                headers: {
                    'Authorization': `token ${GITHUB_TOKEN}`
                }
            });
            if (changelogResponse.ok) {
                return await changelogResponse.text();
            }
        }
    } catch (error) {
        console.error(`Error fetching changelog for ${owner}/${repo}`, error);
    }
    return "No specific new features listed.";
}

// Simulated function to check for vulnerabilities
async function checkVulnerabilities(packageName, currentVersion) {
    // In a real scenario, you would call a vulnerability database/API like Snyk
    // For demonstration, we're using a simulated response
    const simulatedVulnerabilities = {
        "example-package": "1 critical, 2 moderate",
        "another-package": "No known vulnerabilities"
    };

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return simulatedVulnerabilities[packageName] || "No known vulnerabilities";
}
