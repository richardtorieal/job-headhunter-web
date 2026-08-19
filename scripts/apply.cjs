const puppeteer = require('puppeteer-core');
const http = require('http');
const fs = require('fs');

const CONFIG_PATH = '/Users/richardanderson/projects/job-headhunter-web/data/linkedin-apply-config.json';
const APPLIED_PATH = '/Users/richardanderson/projects/job-headhunter-web/data/linkedin-applied-jobs.json';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://axvysdxijstzpfcvnlbm.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4dnlzZHhpanN0enBmY3ZubGJtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzA4Nzg2OSwiZXhwIjoyMTAyNjYzODY5fQ.PULw5Dga6irZMmIv0kyIcTFhy7e3T4EXPUZNKYoJwOI';

let supabaseAdmin = null;
try {
  const { createClient } = require('@supabase/supabase-js');
  supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
} catch (e) {
  console.warn('Supabase client module not available in apply.cjs environment:', e.message);
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const randomDelay = async (min = 2000, max = 5000) => {
  const ms = Math.floor(Math.random() * (max - min)) + min;
  await sleep(ms);
};

async function getWsEndpoint() {
  return new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9222/json/version', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed.webSocketDebuggerUrl);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function safeEvaluate(page, fn, ...args) {
  for (let i = 0; i < 3; i++) {
    try {
      return await page.evaluate(fn, ...args);
    } catch (err) {
      if (err.message.includes('Execution context was destroyed') || err.message.includes('Navigation occurred') || err.message.includes('context')) {
        console.log('Execution context destroyed or navigation occurred, retrying evaluate...');
        await sleep(2000);
        continue;
      }
      throw err;
    }
  }
  throw new Error('Failed to evaluate: Execution context was repeatedly destroyed.');
}

async function run() {
  const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  const appliedData = JSON.parse(fs.readFileSync(APPLIED_PATH, 'utf8'));
  const appliedJobs = appliedData.appliedJobs || [];
  const appliedSet = new Set(appliedJobs.map(j => String(j.jobId)));

  const wsUrl = await getWsEndpoint();
  const browser = await puppeteer.connect({
    browserWSEndpoint: wsUrl,
    defaultViewport: null
  });

  const pages = await browser.pages();
  let page = pages.find(p => p.url().includes('linkedin.com'));
  if (!page) {
    page = await browser.newPage();
  }

  // Session verification
  console.log('Verifying session...');
  try {
    await page.goto('https://www.linkedin.com/feed', { waitUntil: 'load', timeout: 30000 });
    await sleep(3000);
  } catch (err) {
    console.error('Failed to navigate to feed:', err.message);
  }

  const currentUrl = page.url();
  const feedPresent = await safeEvaluate(page, () => {
    const hasNav = !!(
      document.querySelector('header') && 
      (
        document.querySelector('a[href*="/feed"]') || 
        document.querySelector('a[href*="/mynetwork"]') || 
        document.querySelector('a[href*="/jobs"]') || 
        document.querySelector('button[class*="nav"]') || 
        document.querySelector('.global-nav') ||
        document.querySelector('[data-global-nav-item]')
      )
    );
    const hasSignIn = !!(
      document.querySelector('a[href*="/login"]') || 
      document.querySelector('a[href*="/signin"]') ||
      document.querySelector('.sign-in-form')
    );
    return hasNav && !hasSignIn;
  });

  if (currentUrl.includes('/login') || currentUrl.includes('/uas/login') || !feedPresent) {
    console.error('⚠️ LinkedIn session not authenticated in Chrome port 9222. Please log into LinkedIn in the open Chrome window.');
    await page.screenshot({ path: 'linkedin_auth_error.png' });
    await browser.disconnect();
    process.exit(1);
  }

  const reports = {
    applied: [],
    failed: [],
    skipped: [],
    duplicates: 0,
    lifetimeTotalBefore: appliedData.totalApplications || 0
  };

  const queries = config.searchQueries || [];
  let appsCount = 0;

  // Generate both Remote and DFW searches for each query
  const searchUrls = [];
  for (const query of queries) {
    const encoded = encodeURIComponent(query);
    // Remote
    searchUrls.push({
      query: query,
      type: 'Remote',
      url: `https://www.linkedin.com/jobs/search/?keywords=${encoded}&f_WT=2&f_AL=true&sortBy=DD`
    });
    // DFW Local
    searchUrls.push({
      query: query,
      type: 'DFW Local',
      url: `https://www.linkedin.com/jobs/search/?keywords=${encoded}&location=Dallas-Fort%20Worth%2C%20TX&f_WT=1,3&f_AL=true&sortBy=DD`
    });
  }

  for (const searchInfo of searchUrls) {
    if (appsCount >= config.maxApplicationsPerRun) {
      console.log('Reached max applications limit for this run.');
      break;
    }

    console.log(`Searching jobs for query: ${searchInfo.query} (${searchInfo.type})`);
    try {
      await page.goto(searchInfo.url, { waitUntil: 'load', timeout: 30000 });
      try {
        await page.waitForSelector('.jobs-search-results-list, .jobs-search-results-list__list, div.jobs-search-results', { timeout: 10000 });
      } catch (e) {
        console.log('Results container not found, checking if any jobs or no results message.');
      }
      await randomDelay(3000, 6000);
    } catch (err) {
      console.error(`Error navigating to search page: ${err.message}`);
      continue;
    }

    // Scroll through the job listings to load elements
    try {
      await page.evaluate(async () => {
        const container = document.querySelector('.jobs-search-results-list') || document.querySelector('.jobs-search-results-list__list');
        if (container) {
          for (let i = 0; i < 4; i++) {
            container.scrollBy(0, 400);
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      });
    } catch (err) {
      console.warn('Scroll evaluation failed:', err.message);
    }

    // Extract Job Info from listings
    let jobListings = [];
    try {
      jobListings = await page.evaluate(() => {
        const cards = document.querySelectorAll('[data-job-id], .job-card-container, .jobs-search-results__list-item');
        const jobs = [];
        cards.forEach(card => {
          const jobId = card.getAttribute('data-job-id') || card.dataset.jobId || card.querySelector('[data-job-id]')?.getAttribute('data-job-id');
          const titleEl = card.querySelector('.job-card-list__title, .job-card-container__link, a[class*="job-card"]');
          const companyEl = card.querySelector('.job-card-container__primary-description, .job-card-container__company-name, .artdeco-entity-lockup__subtitle, .job-card-container__company-name a');
          const locationEl = card.querySelector('.job-card-container__metadata-item, .job-card-container__metadata-wrapper, .job-card-container__metadata-item--item');

          if (jobId && titleEl) {
            jobs.push({
              jobId: jobId.trim(),
              title: titleEl.innerText.trim(),
              company: companyEl ? companyEl.innerText.trim() : 'Unknown Company',
              location: locationEl ? locationEl.innerText.trim() : 'Unknown Location',
              url: `https://www.linkedin.com/jobs/view/${jobId.trim()}`
            });
          }
        });
        return jobs;
      });
    } catch (err) {
      console.error('Failed to extract job listings:', err.message);
    }

    console.log(`Found ${jobListings.length} job cards for ${searchInfo.query} (${searchInfo.type})`);

    for (const job of jobListings) {
      if (appsCount >= config.maxApplicationsPerRun) break;

      try {
        // Deduplication
        if (appliedSet.has(job.jobId)) {
          console.log(`Skipping duplicate Job ID: ${job.jobId}`);
          reports.duplicates++;
          continue;
        }

        // Title Blacklist check
        const titleLower = job.title.toLowerCase();
        const blacklisted = config.blacklistedKeywords.some(kw => titleLower.includes(kw.toLowerCase()));
        if (blacklisted) {
          console.log(`Skipping blacklisted title: "${job.title}"`);
          reports.skipped.push({ title: job.title, company: job.company, reason: 'Blacklisted title keywords' });
          continue;
        }

        // Open the job
        console.log(`Clicking job: "${job.title}" at "${job.company}"`);
        let clicked = false;
        try {
          clicked = await page.evaluate((id) => {
            const el = document.querySelector(`[data-job-id="${id}"]`) || 
                       Array.from(document.querySelectorAll('a')).find(a => a.href && a.href.includes(id));
            if (el) {
              el.scrollIntoView();
              el.click();
              return true;
            }
            return false;
          }, job.jobId);
        } catch (err) {
          console.warn('Navigation occurred during click or evaluate failed:', err.message);
        }

        if (!clicked) {
          try {
            await page.goto(job.url, { waitUntil: 'load', timeout: 30000 });
          } catch (err) {
            console.error(`Failed to navigate to job URL: ${job.url}`, err.message);
            reports.failed.push({ title: job.title, company: job.company, reason: `Navigation failed: ${err.message}` });
            continue;
          }
        }
        await randomDelay(2000, 4000);

        // Retrieve job description and any visible salary info for filtering
        let jobDetails = null;
        try {
          jobDetails = await page.evaluate(() => {
            const descEl = document.querySelector('#job-details') || 
                           document.querySelector('.jobs-description') || 
                           document.querySelector('.jobs-description__content') ||
                           document.querySelector('.jobs-box__html-content');
            const description = descEl ? descEl.innerText : '';
            
            const topCard = document.querySelector('.jobs-unified-top-card') || document.body;
            const topCardText = topCard ? topCard.innerText : '';
            
            return {
              description: description,
              topCardText: topCardText
            };
          });
        } catch (err) {
          console.warn('Failed to extract job details for filtering:', err.message);
        }

        if (jobDetails) {
          const descLower = jobDetails.description.toLowerCase();
          const combinedText = (jobDetails.description + '\n' + jobDetails.topCardText).toLowerCase();

          // 1. WORK LOCATION EVALUATION (NO FULL-TIME IN-OFFICE)
          const inOfficeKeywords = [
            '100% in-office', '100% on-site', '100% onsite',
            '5 days on-site', '5 days onsite', '5 days in office',
            'full-time in-office', 'full-time on-site', 'full-time onsite',
            'full time in-office', 'full time on-site', 'full time onsite',
            'in-office expectations', 'on-site expectations', 'onsite expectations',
            'onsite 5 days', 'on-site 5 days', '5 days a week on-site'
          ];
          const hasInOffice = inOfficeKeywords.some(kw => combinedText.includes(kw));
          
          if (hasInOffice) {
            console.log(`Skipping job: "${job.title}" at "${job.company}" due to full-time in-office expectations.`);
            reports.skipped.push({ title: job.title, company: job.company, reason: 'Full-time in-office/on-site' });
            continue;
          }

          // 2. ROLE TYPES (MANAGEMENT, ARCHITECTURE, POC, PRODUCT & AI) vs Pure hands-on coding roles
          const codingKeywords = [
            'c++ software engineer', 'c++ developer', 'cpp software engineer', 'cpp developer',
            'java developer', 'java software engineer', 'full stack engineer', 'full stack developer',
            'fullstack engineer', 'fullstack developer', 'backend engineer', 'backend developer',
            'embedded software', 'embedded developer', 'firmware engineer', 'firmware developer'
          ];
          const isPureHandsOn = codingKeywords.some(kw => titleLower.includes(kw) || descLower.includes(kw));
          
          if (isPureHandsOn) {
            console.log(`Skipping job: "${job.title}" at "${job.company}" because it is a pure hands-on software/C++ coding role.`);
            reports.skipped.push({ title: job.title, company: job.company, reason: 'Pure hands-on coding role' });
            continue;
          }

          // 3. MINIMUM SALARY FLOOR
          const cleanTextForSalary = combinedText.replace(/,/g, '');
          const matches = cleanTextForSalary.match(/\$([0-9]+)(k)?/gi);
          
          if (matches) {
            let maxSalaryFound = 0;
            for (const match of matches) {
              let val = parseFloat(match.replace(/\$/g, '').toLowerCase().replace('k', '000'));
              if (val < 1000) {
                // hourly rate: e.g. $80/hr -> convert to annual assuming 2000 hours
                val = val * 2000;
              }
              if (val > maxSalaryFound) {
                maxSalaryFound = val;
              }
            }
            
            if (maxSalaryFound > 0 && maxSalaryFound < (config.minSalary || 175000)) {
              console.log(`Skipping job: "${job.title}" at "${job.company}". Maximum salary found ($${maxSalaryFound}) is below the floor ($${config.minSalary || 175000}/yr).`);
              reports.skipped.push({ title: job.title, company: job.company, reason: `Max salary ($${maxSalaryFound}) below floor` });
              continue;
            }
          }
        }

        // Verify Easy Apply button exists on page
        const easyApplyBtnSelector = 'button.jobs-apply-button';
        let hasEasyApply = false;
        try {
          hasEasyApply = await page.evaluate((sel) => {
            const btn = document.querySelector(sel);
            return btn && btn.innerText.includes('Easy Apply');
          }, easyApplyBtnSelector);
        } catch (err) {
          console.warn('Failed to verify Easy Apply button presence:', err.message);
        }

        if (!hasEasyApply) {
          console.log('No Easy Apply button, skipping.');
          reports.skipped.push({ title: job.title, company: job.company, reason: 'Not Easy Apply' });
          continue;
        }

        // Click Easy Apply button
        console.log('Clicking Easy Apply...');
        let openedModal = false;
        try {
          openedModal = await page.evaluate((sel) => {
            const btn = document.querySelector(sel);
            if (btn) {
              btn.click();
              return true;
            }
            return false;
          }, easyApplyBtnSelector);
        } catch (err) {
          console.warn('Failed to click Easy Apply button:', err.message);
        }

        if (!openedModal) {
          console.log('Failed to click Easy Apply button.');
          reports.failed.push({ title: job.title, company: job.company, reason: 'Easy Apply click failed' });
          continue;
        }

        await randomDelay(2000, 3000);

        // Easy Apply Modal Loop
        let modalClosed = false;
        let stepCount = 0;
        let maxSteps = 15; // safety threshold
        let lastSubmitSuccessful = false;

        while (!modalClosed && stepCount < maxSteps) {
          stepCount++;
          // Check for presence of modal/form
          let modalData = null;
          try {
            modalData = await page.evaluate(() => {
              const modal = document.querySelector('.jobs-easy-apply-modal, [role="dialog"]');
              if (!modal) return null;
              
              // Precise buttons matching standard aria labels
              const nextBtn = modal.querySelector('button[aria-label="Continue to next step"], button[aria-label="Review your application"], button[aria-label*="Submit"]');
              const submitBtn = modal.querySelector('button[aria-label="Submit application"]');
              const title = modal.querySelector('h3, h2, h1')?.innerText || '';

              // Look for input fields
              const inputs = Array.from(modal.querySelectorAll('input, select, textarea')).map(el => {
                const label = modal.querySelector(`label[for="${el.id}"]`)?.innerText || el.getAttribute('aria-label') || el.name || '';
                const type = el.tagName === 'SELECT' ? 'select' : el.type;
                return {
                  id: el.id,
                  label: label.trim(),
                  type: type,
                  value: el.value,
                  name: el.name
                };
              });

              return {
                title: title.trim(),
                hasButtons: !!nextBtn || !!submitBtn,
                isSubmit: !!submitBtn,
                nextBtnText: nextBtn ? nextBtn.innerText.trim() : '',
                inputs: inputs
              };
            });
          } catch (err) {
            console.warn('Evaluation failed during modal state check:', err.message);
            break;
          }

          if (!modalData) {
            console.log('Modal no longer present.');
            break;
          }

          console.log(`Step ${stepCount}: "${modalData.title}". IsSubmit: ${modalData.isSubmit}, Button Text: "${modalData.nextBtnText}"`);

          // Handle inputs
          for (const input of modalData.inputs) {
            // If it's a resume selection page, check if resume is already selected or we need to upload
            if (input.type === 'file') {
              console.log(`Uploading resume to input #${input.id}`);
              const fileInput = await page.$(`input[id="${input.id}"]`);
              if (fileInput) {
                await fileInput.uploadFile(config.resumePath);
                await randomDelay(1500, 3000);
              }
              continue;
            }

            // Handle radio options
            if (input.type === 'radio') {
              const resolved = await page.evaluate((id, defaults) => {
                const el = document.getElementById(id);
                if (!el) return false;
                const questionContainer = el.closest('fieldset, .jobs-easy-apply-form-section__grouping');
                if (!questionContainer) return false;
                const questionText = questionContainer.querySelector('legend, span')?.innerText || '';

                const q = questionText.toLowerCase();
                let targetVal = null;
                if (q.includes('sponsorship') || q.includes('visa')) {
                  targetVal = defaults.requireSponsorship; // "No"
                } else if (q.includes('authorized') || q.includes('work in the') || q.includes('legally')) {
                  targetVal = defaults.authorizedToWork; // "Yes"
                } else if (q.includes('reloc')) {
                  targetVal = defaults.willingToRelocate;
                } else if (q.includes('clearance')) {
                  targetVal = 'No';
                }

                if (targetVal) {
                  const label = questionContainer.querySelector(`label[for="${id}"]`)?.innerText || '';
                  if (label.toLowerCase().includes(targetVal.toLowerCase())) {
                    el.click();
                    return true;
                  }
                }
                return false;
              }, input.id, config.defaultAnswers);
              continue;
            }

            // Handle text / number inputs (specifically handle missing numbers/questions)
            if (input.type === 'text' || input.type === 'number' || input.type === 'textarea') {
              await page.evaluate((id, defaults) => {
                const el = document.getElementById(id);
                if (!el || el.value) return; // don't overwrite pre-filled

                const questionContainer = el.closest('.jobs-easy-apply-form-section__grouping, .jobs-easy-apply-form-element');
                const questionText = questionContainer ? (questionContainer.querySelector('label')?.innerText || '') : '';
                const q = questionText.toLowerCase();

                if (q.includes('email') || q.includes('mail address')) {
                  el.value = defaults.email || "Richard.torieal@gmail.com";
                } else if (q.includes('phone') || q.includes('mobile') || q.includes('contact number')) {
                  el.value = defaults.phone || "(863) 513-5131";
                } else if (q.includes('location') || q.includes('city') || q.includes('state') || q.includes('zip') || q.includes('address')) {
                  el.value = defaults.location || "Dallas-Fort Worth, TX";
                } else if (q.includes('years of experience') || q.includes('how many years') || q.includes('experience')) {
                  el.value = defaults.yearsOfExperience.replace(/\D/g, '') || "10";
                } else if (q.includes('salary') || q.includes('compensation')) {
                  el.value = defaults.desiredSalary;
                } else if (q.includes('linkedin')) {
                  el.value = defaults.linkedinProfile;
                } else if (q.includes('notice period') || q.includes('start date') || q.includes('earliest start')) {
                  el.value = defaults.startDate;
                } else {
                  if (q.includes('why') || q.includes('describe') || q.includes('interest')) {
                    el.value = "I am a seasoned engineering leader with 10+ years of experience leading complex data architectures and AI initiatives. I bring strong strategic vision and technical execution matching the job specifications perfectly.";
                  } else {
                    el.value = "10"; // standard default safe fallback for numbers/text
                  }
                }
                el.dispatchEvent(new Event('input', { bubbles: true }));
                el.dispatchEvent(new Event('change', { bubbles: true }));
              }, input.id, config.defaultAnswers);
              continue;
            }

            // Handle dropdowns / selects
            if (input.type === 'select') {
              await page.evaluate((id, defaults) => {
                const el = document.getElementById(id);
                if (!el) return;
                const questionContainer = el.closest('.jobs-easy-apply-form-element, .jobs-easy-apply-form-section__grouping');
                const questionText = questionContainer ? (questionContainer.querySelector('label')?.innerText || '') : '';
                const q = questionText.toLowerCase();

                let targetVal = 'yes';
                if (q.includes('sponsorship')) {
                  targetVal = defaults.requireSponsorship; // "No"
                } else if (q.includes('authorized')) {
                  targetVal = defaults.authorizedToWork;
                } else if (q.includes('education') || q.includes('degree')) {
                  targetVal = 'bachelor';
                }

                const options = Array.from(el.options);
                const bestOpt = options.find(opt => opt.text.toLowerCase().includes(targetVal.toLowerCase())) || options[1];
                if (bestOpt) {
                  el.value = bestOpt.value;
                  el.dispatchEvent(new Event('change', { bubbles: true }));
                }
              }, input.id, config.defaultAnswers);
              continue;
            }
          }

          await randomDelay(1000, 2000);

          // Click next / submit button
          let actionResult = { success: false, closed: false, submitted: false };
          try {
            actionResult = await page.evaluate(async () => {
              const modal = document.querySelector('.jobs-easy-apply-modal, [role="dialog"]');
              if (!modal) return { success: false, closed: true };

              // Handle errors if present on current step (e.g. fill remaining fields)
              const errorFeedbacks = Array.from(modal.querySelectorAll('.artdeco-inline-feedback--error'));
              if (errorFeedbacks.length > 0) {
                const emptyInputs = Array.from(modal.querySelectorAll('input[type="text"], input[type="number"]')).filter(i => !i.value);
                emptyInputs.forEach(inp => {
                  inp.value = "10";
                  inp.dispatchEvent(new Event('input', { bubbles: true }));
                  inp.dispatchEvent(new Event('change', { bubbles: true }));
                });
              }

              const submitBtn = modal.querySelector('button[aria-label="Submit application"]');
              if (submitBtn) {
                submitBtn.click();
                return { success: true, closed: false, submitted: true };
              }

              const nextBtn = modal.querySelector('button[aria-label="Continue to next step"], button[aria-label="Review your application"]');
              if (nextBtn) {
                nextBtn.click();
                return { success: true, closed: false, submitted: false };
              }

              return { success: false, closed: false };
            });
          } catch (err) {
            console.warn('Clicking modal action button failed:', err.message);
            break;
          }

          if (actionResult.submitted) {
            lastSubmitSuccessful = true;
            await randomDelay(3000, 5000);
            break;
          }

          if (actionResult.closed) {
            break;
          }

          await randomDelay(2000, 4000);
        }

        // Handle post-submit confirmation / close modal
        if (lastSubmitSuccessful) {
          console.log(`Successfully applied to ${job.title} at ${job.company}`);
          appsCount++;
          reports.applied.push({ jobId: job.jobId, title: job.title, company: job.company, method: 'easyApply' });

          // Close post-apply window if it remains
          try {
            await page.evaluate(() => {
              const closeBtn = document.querySelector('button[aria-label*="Dismiss"], button[aria-label*="Close"], button[aria-label*="Done"]');
              if (closeBtn) closeBtn.click();
            });
          } catch (err) {
            console.warn('Failed to click post-apply close button:', err.message);
          }
          await randomDelay(1500, 3000);
        } else {
          console.log(`Application failed or canceled for ${job.title}`);
          reports.failed.push({ title: job.title, company: job.company, reason: 'Modal loop completed without submit' });
          // Close modal or dialog by clicking Discard if it is open
          try {
            await page.evaluate(async () => {
              const closeBtn = document.querySelector('button[aria-label*="Dismiss"], button[aria-label*="Close"]');
              if (closeBtn) closeBtn.click();
              await new Promise(resolve => setTimeout(resolve, 1000));
              const discardBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText && b.innerText.includes('Discard'));
              if (discardBtn) discardBtn.click();
            });
          } catch (err) {
            console.warn('Failed to clean up and close failed modal:', err.message);
          }
          await randomDelay(1000, 2000);
        }
      } catch (err) {
        console.error(`Error processing job "${job.title}" at "${job.company}":`, err.message);
        reports.failed.push({ title: job.title, company: job.company, reason: `Uncaught exception: ${err.message}` });
        try {
          await page.evaluate(async () => {
            const closeBtn = document.querySelector('button[aria-label*="Dismiss"], button[aria-label*="Close"]');
            if (closeBtn) closeBtn.click();
            await new Promise(resolve => setTimeout(resolve, 1000));
            const discardBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText && b.innerText.includes('Discard'));
            if (discardBtn) discardBtn.click();
          });
        } catch (cleanupErr) {
          console.warn('Failed to clean up modal after error:', cleanupErr.message);
        }
        await randomDelay(2000, 4000);
      }
    }
  }

  // Update records
  console.log('All search queries processed. Writing output...');
  
  const updatedJobs = [...appliedJobs];
  reports.applied.forEach(j => {
    // Only push if not already in updatedJobs
    if (!updatedJobs.some(x => String(x.jobId) === String(j.jobId))) {
      updatedJobs.push({
        jobId: j.jobId,
        title: j.title,
        company: j.company,
        url: `https://www.linkedin.com/jobs/view/${j.jobId}`,
        appliedAt: new Date().toISOString(),
        method: 'easyApply',
        status: 'applied',
        notes: 'Successfully submitted'
      });
    }
  });

  const finalTotal = reports.lifetimeTotalBefore + reports.applied.length;

  fs.writeFileSync(APPLIED_PATH, JSON.stringify({
    appliedJobs: updatedJobs,
    lastRunAt: new Date().toISOString(),
    totalApplications: finalTotal,
    schemaVersion: '1.0'
  }, null, 2));

  // Programmatic Supabase Sync
  if (supabaseAdmin) {
    console.log('Syncing applied jobs to Supabase...');
    const dbRows = updatedJobs.map(j => ({
      job_id: String(j.jobId),
      title: j.title || 'Unknown Role',
      company: j.company || 'Unknown Company',
      url: j.url || `https://www.linkedin.com/jobs/view/${j.jobId}`,
      applied_at: j.appliedAt || new Date().toISOString(),
      method: j.method || 'easyApply',
      status: j.status || 'applied',
      salary: j.salary || null,
      min_salary: j.minSalary || null,
      max_salary: j.maxSalary || null,
      location: j.location || 'Remote, US',
      notes: j.notes || null,
      logo_url: j.companyLogo || j.logoUrl || null,
      company_domain: j.companyDomain || null
    }));

    try {
      // Upsert in batches of 50
      for (let i = 0; i < dbRows.length; i += 50) {
        const chunk = dbRows.slice(i, i + 50);
        await supabaseAdmin.from('jobs').upsert(chunk, { onConflict: 'job_id' });
      }
      console.log(`✓ Programmatically synced ${dbRows.length} jobs to Supabase.`);
    } catch (sbErr) {
      console.error('⚠️  Failed to sync jobs to Supabase:', sbErr.message);
    }
  }

  // Print Summary Report
  console.log(`
📋 **LinkedIn Auto-Apply Report**
🕐 Run completed at: ${new Date().toISOString()}

✅ **Applications Submitted:** ${reports.applied.length}
❌ **Failed:** ${reports.failed.length}
⏭️ **Skipped (duplicate/filtered):** ${reports.skipped.length}
📊 **Total Lifetime Applications:** ${finalTotal}

**Jobs Applied To:**
${reports.applied.map((j, idx) => `${idx + 1}. ${j.title} at ${j.company} — ${j.method} ✅`).join('\n') || 'None'}

**Jobs Skipped:**
${reports.skipped.slice(0, 10).map(j => `- ${j.title} at ${j.company} — Reason: ${j.reason}`).join('\n') || 'None'}
  `);

  try {
    await browser.disconnect();
  } catch (err) {}
}

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

run();
