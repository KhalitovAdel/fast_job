const axios = require('axios');
const { promises } = require('fs');
const { join } = require('path');
const { repeat } = require('./utils');

class Sber {
    constructor(axios) {
        this.axios = axios
    }

    async list(keyword, page = 0) {
        const { totalPages, vacancies } = await this.axios.request({
            method: 'GET',
            url: 'https://rabota.sber.ru/v2/gateway/api/pulseservice/v1/search/get',
            params: {
                keyword,
                page
            }
        }).then(d => d.data);

        return { totalPages, vacancies }
    }

    async getAll(keyword) {
        const { totalPages, vacancies } = await this.list(keyword);
        const result = vacancies;
    
        const promises = Array.from({ length: totalPages - 1}, (v, i) => i + 1).map(async page => {
            const { vacancies: v } = await this.list(keyword, page);
            result.push(...v);
        })
    
        await Promise.all(promises);

        return result;
    }

    async get(jobId) {
        return axios.request({
            method: 'GET',
            url: `https://rabota.sber.ru/v2/gateway/api/pulseservice/v1/search/get/${jobId}`,
        }).then(d => d.data);
    }

    async apply(jobRequisitionId, {
        firstName, 
        lastName, 
        middleName, 
        email, 
        cell = '+7 (962) 577-09-90',
        resume
    }) {
        return axios.request({
            method: 'POST',
            url: `https://rabota.sber.ru/v2/gateway/api/pulseservice/v1/apply`,
            data: `{"agree":true,"firstName":"${firstName}","lastName":"${lastName}","middleName":"${middleName}","email":"${email}","cell":"${cell}","jobRequisitionId":"${jobRequisitionId}","sourceId":"1234","sourceDetailId":"Карьерный портал","resume":"${resume}","resumeMediaType":"application/pdf"}`,
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(d => d.data);
    }


    static async main(keyword = 'javascript') {
        const instance = new Sber(axios.create());
        const resume = await promises.readFile(join(process.cwd(), 'cv.pdf'), {encoding: 'base64'});

        const jobs = await repeat(() => instance.getAll(keyword));

        while(jobs.length) {
            const { internalId } = jobs.pop();
            const { jobRequisitionId } = await repeat(() => instance.get(internalId));
            try {
                await instance.apply(jobRequisitionId, {
                    resume,
                    firstName: 'Адель', 
                    lastName: 'Халитов', 
                    middleName: 'Марсович', 
                    email: 'adelkhalitov1+job@gmail.com', 
                    cell: '+7 (962) 577-09-90',
                });
                console.log(`${internalId} applied`)
            } catch (e) {
                console.error(`Error while applying ${internalId}`, e.message)
            }
        }
    }
}

Sber.main();