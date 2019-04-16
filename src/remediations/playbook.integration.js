'use strict';

const { request, mockDate } = require('../test');

describe('playbooks', function () {
    test('generates playbook with pydata and playbook support', async () => {
        mockDate();
        const {text, headers} = await request
        .get('/v1/remediations/66eec356-dd06-4c72-a3b6-ef27d1508a02/playbook')
        .expect(200);

        headers['content-disposition'].should.match(/^attachment;filename="remediation-1-[0-9]+\.yml"$/);
        expect(text).toMatchSnapshot();
    });

    test('generates playbook that does not need reboot', async () => {
        mockDate();
        const {text, headers} = await request
        .get('/v1/remediations/e809526c-56f5-4cd8-a809-93328436ea23/playbook')
        .expect(200);

        headers['content-disposition'].should.match(/^attachment;filename="unnamed-playbook-[0-9]+\.yml"$/);
        expect(text).toMatchSnapshot();
    });

    test('generates playbook with suppressed reboot', async () => {
        mockDate();
        const {text, headers} = await request
        .get('/v1/remediations/178cf0c8-35dd-42a3-96d5-7b50f9d211f6/playbook')
        .expect(200);

        headers['content-disposition'].should.match(/^attachment;filename="remediation-with-suppressed-reboot-[0-9]+\.yml"$/);
        expect(text).toMatchSnapshot();
    });

    test('playbook for remediation with zero issues does not freak out', async () => {
        const {text} = await request
        .get('/v1/remediations/256ab1d3-58cf-1292-35e6-1a49c8b122d3/playbook')
        .expect(204);

        expect(text).toMatchSnapshot();
    });

    describe('caching', function () {
        async function testCaching (desc, id, etag) {
            test (desc, async () => {
                const {headers} = await request
                .get(`/v1/remediations/${id}/playbook`)
                .expect(200);

                headers.etag.should.equal(etag);

                await request
                .get(`/v1/remediations/${id}/playbook`)
                .set('if-none-match', etag)
                .expect(304);
            });
        }

        testCaching('pydata playbook', '66eec356-dd06-4c72-a3b6-ef27d1508a02', 'W/"1f7c-Dt7a6WWmWp5pj9H06OLx91pc6WM"');
        testCaching('no reboot playbook', 'e809526c-56f5-4cd8-a809-93328436ea23', 'W/"944-iFtx+BHAhy9qJeTGQguEagp6NOw"');
        testCaching('playbook with suppressed reboot', '178cf0c8-35dd-42a3-96d5-7b50f9d211f6',
            'W/"be1-rUthu0Xdr4iix21vbFDjKM4qIeQ"');

        test('pydata playbook caching with stale data', async () => {
            await request
            .get('/v1/remediations/66eec356-dd06-4c72-a3b6-ef27d1508a02/playbook')
            .set('if-none-match', 'W/"1e4d-hLarcuq+AQP/rL6nnA70UohsnSI"')
            .expect(200);
        });
    });
});
